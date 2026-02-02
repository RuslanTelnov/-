import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { syncMoySklad } from "@/lib/inngest/functions/sync";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        syncMoySklad,
    ],
});
