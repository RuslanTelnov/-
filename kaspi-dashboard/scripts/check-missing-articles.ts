
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkMissingArticles() {
    const { data: products } = await supabase.from('products').select('id, article')

    if (!products) return

    const missingArticle = products.filter(p => !p.article || p.article.trim() === '')
    console.log(`Total Products: ${products.length}`)
    console.log(`Missing Article: ${missingArticle.length}`)

    if (missingArticle.length > 0) {
        console.log('Sample IDs with missing article:', missingArticle.slice(0, 5).map(p => p.id))
    }
}

checkMissingArticles()
