-- ============================================
-- RAG SYSTEM: VECTOR STORE MIGRATION
-- Создание таблиц и функций для pgvector
-- ============================================

-- Шаг 1: Включаем расширение pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Шаг 2: Создаем таблицу для хранения векторных эмбеддингов
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  source_table TEXT,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Шаг 3: Создаем индексы для быстрого поиска
-- IVFFlat индекс для векторного поиска (cosine similarity)
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- GIN индекс для фильтрации по метаданным
CREATE INDEX IF NOT EXISTS document_embeddings_metadata_idx 
ON document_embeddings 
USING GIN (metadata);

-- Индекс для фильтрации по источнику
CREATE INDEX IF NOT EXISTS document_embeddings_source_idx 
ON document_embeddings (source_table, source_id);

-- Шаг 4: Функция для поиска похожих документов
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_metadata jsonb DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_table TEXT,
  source_id UUID,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.metadata,
    document_embeddings.source_table,
    document_embeddings.source_id,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE 
    (filter_metadata IS NULL OR document_embeddings.metadata @> filter_metadata)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Шаг 5: Функция для гибридного поиска (векторный + полнотекстовый)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_table TEXT,
  source_id UUID,
  similarity float,
  text_rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.metadata,
    document_embeddings.source_table,
    document_embeddings.source_id,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity,
    ts_rank(to_tsvector('russian', document_embeddings.content), plainto_tsquery('russian', query_text)) AS text_rank
  FROM document_embeddings
  WHERE 
    1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
    OR to_tsvector('russian', document_embeddings.content) @@ plainto_tsquery('russian', query_text)
  ORDER BY 
    (1 - (document_embeddings.embedding <=> query_embedding)) * 0.7 + 
    ts_rank(to_tsvector('russian', document_embeddings.content), plainto_tsquery('russian', query_text)) * 0.3 DESC
  LIMIT match_count;
END;
$$;

-- Шаг 6: Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_document_embeddings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_document_embeddings_updated_at_trigger
  BEFORE UPDATE ON document_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_document_embeddings_updated_at();

-- Шаг 7: Таблица для отслеживания статуса индексации
CREATE TABLE IF NOT EXISTS indexing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  total_documents INTEGER DEFAULT 0,
  indexed_documents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска статуса
CREATE INDEX IF NOT EXISTS indexing_status_source_table_idx 
ON indexing_status (source_table, status);

-- ============================================
-- ГОТОВО! Vector store настроен
-- ============================================
