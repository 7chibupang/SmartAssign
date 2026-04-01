import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import QuestionTable from '../components/QuestionTable';
import QuestionForm from '../components/QuestionForm';
import AIGenerator from '../components/AIGenerator';

const QuestionPage = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [aiGeneratorVisible, setAiGeneratorVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 监听事件打开表单
  useEffect(() => {
    const handleOpenQuestionForm = () => {
      setFormVisible(true);
      setEditingQuestion(null);
    };

    const handleOpenAIGenerator = () => {
      setAiGeneratorVisible(true);
    };

    window.addEventListener('openQuestionForm', handleOpenQuestionForm);
    window.addEventListener('openAIGenerator', handleOpenAIGenerator);

    return () => {
      window.removeEventListener('openQuestionForm', handleOpenQuestionForm);
      window.removeEventListener('openAIGenerator', handleOpenAIGenerator);
    };
  }, []);

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormVisible(true);
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setEditingQuestion(null);
  };

  const handleFormSuccess = () => {
    message.success(editingQuestion ? '更新成功' : '创建成功');
    setRefreshKey(prev => prev + 1);
  };

  const handleAIGeneratorClose = () => {
    setAiGeneratorVisible(false);
  };

  const handleAIGeneratorSuccess = () => {
    message.success('AI题目生成成功');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <Card>
        <QuestionTable 
          onEdit={handleEdit}
          refreshKey={refreshKey}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      </Card>

      {/* 手工出题/编辑表单 */}
      <QuestionForm
        open={formVisible}
        onClose={handleFormClose}
        question={editingQuestion}
        onSuccess={handleFormSuccess}
      />

      {/* AI出题弹窗 */}
      <AIGenerator
        open={aiGeneratorVisible}
        onClose={handleAIGeneratorClose}
        onSuccess={handleAIGeneratorSuccess}
      />
    </div>
  );
};

export default QuestionPage;