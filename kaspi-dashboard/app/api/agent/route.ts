import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { createSqlAgent, SqlToolkit } from "langchain/agents/toolkits/sql";
import { ChatOpenAI } from "@langchain/openai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for agent reasoning

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Use the connection string from env
        // Note: In production, you might want to use a connection pool or a singleton instance
        const datasource = new DataSource({
            type: "postgres",
            url: process.env.DATABASE_URL,
            synchronize: false,
            logging: false,
        });

        await datasource.initialize();

        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: datasource,
        });

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            console.warn('⚠️ OpenAI API key is missing or invalid. Returning mock response.');
            // Mock response for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({
                reply: `[DEMO MODE] Я вижу ваш вопрос: "${message}". \n\nДля реального ответа мне нужен OpenAI API Key. \n\nПока я могу сказать, что в базе данных есть таблица 'products' с ${Math.floor(Math.random() * 1000)} товарами.`
            });
        }

        const llm = new ChatOpenAI({
            modelName: "gpt-4-turbo-preview",
            temperature: 0,
            openAIApiKey: apiKey,
        });

        const toolkit = new SqlToolkit(db, llm);
        const executor = createSqlAgent(llm, toolkit);

        console.log(`🤖 Agent received: "${message}"`);

        const result = await executor.invoke({ input: message });

        console.log(`🤖 Agent replied: "${result.output}"`);

        await datasource.destroy();

        return NextResponse.json({ reply: result.output });

    } catch (error: any) {
        console.error('Agent error:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({
            reply: 'Извините, произошла ошибка при выполнении запроса. Проверьте логи сервера.',
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
}
