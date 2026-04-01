import React, { useState, useEffect } from 'react';
import { Card, Skeleton, Alert } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLearningNote } from '../services/api';

const LearningNote = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLearningNote();
  }, []);

  const fetchLearningNote = async () => {
    try {
      setLoading(true);
      const response = await getLearningNote();
      setContent(response.content);
      setError(null);
    } catch (err) {
      setError('加载学习心得失败');
      setContent('# 学习心得\n\n## 加载失败\n\n请检查学习心得.md文件是否存在。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ padding: 24 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto',
        padding: '0 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 style={{ color: '#1890ff', borderBottom: '2px solid #f0f0f0', paddingBottom: 8 }} {...props} />,
            h2: ({ node, ...props }) => <h2 style={{ color: '#333', borderLeft: '4px solid #1890ff', paddingLeft: 12, marginTop: 24 }} {...props} />,
            h3: ({ node, ...props }) => <h3 style={{ color: '#555' }} {...props} />,
            p: ({ node, ...props }) => <p style={{ lineHeight: 1.8, marginBottom: 16 }} {...props} />,
            ul: ({ node, ...props }) => <ul style={{ paddingLeft: 24, lineHeight: 1.8 }} {...props} />,
            ol: ({ node, ...props }) => <ol style={{ paddingLeft: 24, lineHeight: 1.8 }} {...props} />,
            li: ({ node, ...props }) => <li style={{ marginBottom: 8 }} {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote style={{
                borderLeft: '4px solid #d0e0ff',
                backgroundColor: '#f8faff',
                padding: '12px 20px',
                margin: '16px 0',
                borderRadius: '0 4px 4px 0',
                color: '#555',
              }} {...props} />
            ),
            code: ({ node, inline, ...props }) => {
              if (inline) {
                return <code style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '2px 6px', 
                  borderRadius: 3,
                  fontFamily: 'monospace' 
                }} {...props} />;
              }
              return <code style={{ 
                display: 'block',
                backgroundColor: '#f6f8fa', 
                padding: 16, 
                borderRadius: 6,
                fontFamily: 'monospace',
                overflow: 'auto',
                margin: '16px 0'
              }} {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Card>
  );
};

export default LearningNote;