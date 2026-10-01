import React from 'react';
import { RAGKnowledgeBase } from '../components/rag/RAGKnowledgeBase';

export const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="py-2">
      <RAGKnowledgeBase />
    </div>
  );
};
