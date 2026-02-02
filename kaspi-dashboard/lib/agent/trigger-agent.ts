import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { supabaseAdmin } from "../supabase/server";
import { Calculator } from "../utils/calculator";

export class TriggerAgent {
    private model: ChatOpenAI;

    constructor() {
        this.model = new ChatOpenAI({
            modelName: "gpt-4-turbo-preview",
            temperature: 0,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Evaluates all active triggers and executes actions if conditions are met.
     */
    async evaluateTriggers() {
        console.log("🤖 TriggerAgent: Starting evaluation...");

        // 1. Fetch active triggers
        const { data: triggers, error } = await (supabaseAdmin as any)
            .from("agent_triggers")
            .select("*")
            .eq("is_active", true);

        if (error) {
            console.error("❌ Error fetching triggers:", error);
            return;
        }

        if (!triggers || triggers.length === 0) {
            console.log("ℹ️ No active triggers found.");
            return;
        }

        console.log(`📋 Found ${triggers.length} active triggers.`);

        // 2. Define Tools
        const tools = [
            new DynamicStructuredTool({
                name: "sql_query",
                description: "Execute a SELECT SQL query against the database to check data. Tables: products, stock, sales, profit_by_product.",
                schema: z.object({
                    query: z.string().describe("The SELECT SQL query to execute."),
                }),
                func: async ({ query }) => {
                    try {
                        // Safety check: only allow SELECT
                        if (!query.trim().toLowerCase().startsWith("select")) {
                            return "Error: Only SELECT queries are allowed.";
                        }
                        return "Error: Raw SQL not supported in this version. Use 'get_table_data' instead.";
                    } catch (e: any) {
                        return `Error executing query: ${e.message}`;
                    }
                },
            }),
            new DynamicStructuredTool({
                name: "get_table_data",
                description: "Fetch data from a table with optional filters. Use this to check conditions.",
                schema: z.object({
                    table: z.enum(["products", "stock", "sales", "profit_by_product"]),
                    columns: z.string().optional().describe("Comma-separated columns to select (default: *)"),
                    filter_column: z.string().optional(),
                    filter_operator: z.enum(["eq", "gt", "lt", "gte", "lte", "neq", "is"]).optional(),
                    filter_value: z.any().optional(),
                    limit: z.number().optional().default(10),
                }),
                func: async ({ table, columns = "*", filter_column, filter_operator, filter_value, limit }) => {
                    let query = supabaseAdmin.from(table).select(columns).limit(limit);

                    if (filter_column && filter_operator && filter_value !== undefined) {
                        switch (filter_operator) {
                            case 'eq': query = query.eq(filter_column, filter_value); break;
                            case 'gt': query = query.gt(filter_column, filter_value); break;
                            case 'lt': query = query.lt(filter_column, filter_value); break;
                            case 'gte': query = query.gte(filter_column, filter_value); break;
                            case 'lte': query = query.lte(filter_column, filter_value); break;
                            case 'neq': query = query.neq(filter_column, filter_value); break;
                            case 'is': query = query.is(filter_column, filter_value); break;
                        }
                    }

                    const { data, error } = await query;
                    if (error) return `Error: ${error.message}`;
                    return JSON.stringify(data);
                }
            }),
            new DynamicStructuredTool({
                name: "calculate_metrics",
                description: "Calculate financial metrics using the Calculator utility.",
                schema: z.object({
                    operation: z.enum(["margin", "margin_percent", "markup_percent", "turnover"]),
                    value1: z.number(),
                    value2: z.number(),
                }),
                func: async ({ operation, value1, value2 }) => {
                    if (operation === 'margin') return Calculator.calculateMargin(value1, value2).toString();
                    if (operation === 'margin_percent') return Calculator.calculateMarginPercent(value1, value2).toString();
                    if (operation === 'markup_percent') return Calculator.calculateMarkupPercent(value1, value2).toString();
                    if (operation === 'turnover') return Calculator.calculateTurnover(value1, value2).toString();
                    return "Error: Unknown operation";
                }
            })
        ];

        // 3. Iterate and Execute
        for (const trigger of triggers) {
            console.log(`▶️ Evaluating trigger: ${trigger.name}`);

            // Create a task record
            const { data: task, error: taskError } = await (supabaseAdmin as any)
                .from("agent_tasks")
                .insert({
                    trigger_id: trigger.id,
                    status: "running",
                    logs: "Starting evaluation...",
                })
                .select()
                .single();

            if (taskError) {
                console.error("❌ Error creating task:", taskError);
                continue;
            }

            try {
                const prompt = ChatPromptTemplate.fromMessages([
                    ["system", `You are an intelligent business automation agent. 
           Your goal is to evaluate a specific business rule (trigger) and execute actions if the condition is met.
           
           Trigger Name: ${trigger.name}
           Description: ${trigger.description}
           
           STEP 1: Check the Condition
           Condition: "${trigger.condition_prompt}"
           Use the available tools to fetch data and verify if this condition is true.
           
           STEP 2: Execute Action (if Condition is True)
           Action: "${trigger.action_prompt}"
           If the condition is true, generate a detailed result/report based on the action prompt.
           If the condition is false, simply state "Condition not met."
           
           Output the final result clearly.
           `],
                    ["user", "Evaluate this trigger now."],
                    new MessagesPlaceholder("agent_scratchpad"),
                ]);

                const agent = await createOpenAIFunctionsAgent({
                    llm: this.model,
                    tools,
                    prompt,
                });

                const executor = new AgentExecutor({
                    agent,
                    tools,
                    verbose: true, // Log thoughts to console
                });

                const result = await executor.invoke({});

                console.log(`✅ Trigger finished. Result: ${result.output}`);

                // Update task status
                await (supabaseAdmin as any)
                    .from("agent_tasks")
                    .update({
                        status: "completed",
                        result: result.output,
                        logs: "Evaluation completed successfully.",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", task.id);

            } catch (err: any) {
                console.error(`❌ Error executing trigger ${trigger.name}:`, err);
                await (supabaseAdmin as any)
                    .from("agent_tasks")
                    .update({
                        status: "failed",
                        logs: `Error: ${err.message}`,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", task.id);
            }
        }
    }

    /**
     * Generates new triggers based on data analysis.
     */
    async generateNewTriggers() {
        // Placeholder
        return "Feature coming soon: Auto-generation of triggers.";
    }
}
