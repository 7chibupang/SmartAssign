import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLearningNote, updateLearningNote } from '../services/api';

const HomePage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchLearningNote();
  }, []);

  const fetchLearningNote = async () => {
    try {
      setLoading(true);
      const response = await getLearningNote();
      setContent(response.content);
      setEditContent(response.content);
    } catch (error) {
      message.error('加载学习心得失败');
      // 设置默认内容
      const defaultContent = `# 学习心得

## 项目开发感悟

在开发这个题库管理系统的过程中，我深刻体会到了前后端分离开发模式的便利性。通过将前端和后端分离，可以独立开发和部署，提高了开发效率。

## 技术收获

### 1. Go语言开发
- 学会了使用Gin框架构建RESTful API
- 掌握了SQLite数据库的操作
- 理解了中间件的工作原理

### 2. React前端开发
- 熟练使用Ant Design组件库
- 掌握了React Hooks的使用
- 学会了使用React Router进行路由管理

### 3. 项目架构
- 理解了前后端分离的架构设计
- 掌握了API接口的设计规范
- 学会了处理跨域问题

## 遇到的问题及解决方案

### 1. 跨域问题
**问题**：前端运行在5173端口，后端运行在8080端口，出现跨域问题。
**解决方案**：通过配置Vite代理和CORS中间件解决。

### 2. 大模型API调用
**问题**：大模型API返回格式不统一。
**解决方案**：编写统一的解析函数，处理不同格式的响应。

### 3. 数据库设计
**问题**：题目类型多样，数据库表设计复杂。
**解决方案**：使用JSON字段存储选项和答案，提高灵活性。

## 总结

通过本次大作业的实践，我不仅掌握了Go和React的开发技能，更重要的是学会了如何设计一个完整的Web应用系统。从需求分析、架构设计到编码实现，每一个环节都让我受益匪浅。

在未来的学习中，我会继续深入探索前后端技术，不断提升自己的开发能力。`;
      
      setContent(defaultContent);
      setEditContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      // 在实际项目中，这里应该调用API保存到服务器
      // 由于作业要求是从文件读取，我们这里模拟保存
      await updateLearningNote({ content: editContent });
      
      setContent(editContent);
      setEditing(false);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setEditing(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>学习心得</h2>
        
        {!editing ? (
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑
          </Button>
        ) : (
          <Space>
            <Button 
              icon={<CloseOutlined />}
              onClick={handleCancel}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        )}
      </div>

      <Card loading={loading}>
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: 500,
              padding: 16,
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.6,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              resize: 'vertical',
            }}
            placeholder="请输入Markdown格式的学习心得..."
          />
        ) : (
          <div style={{ 
            maxWidth: 800, 
            margin: '0 auto',
            padding: '0 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 
                    style={{ 
                      color: '#1890ff', 
                      borderBottom: '2px solid #f0f0f0', 
                      paddingBottom: 8,
                      marginBottom: 24 
                    }} 
                    {...props} 
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2 
                    style={{ 
                      color: '#333', 
                      borderLeft: '4px solid #1890ff', 
                      paddingLeft: 12, 
                      marginTop: 32,
                      marginBottom: 16 
                    }} 
                    {...props} 
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3 
                    style={{ 
                      color: '#555',
                      marginTop: 24,
                      marginBottom: 12 
                    }} 
                    {...props} 
                  />
                ),
                h4: ({ node, ...props }) => (
                  <h4 
                    style={{ 
                      color: '#666',
                      marginTop: 20,
                      marginBottom: 10 
                    }} 
                    {...props} 
                  />
                ),
                p: ({ node, ...props }) => (
                  <p 
                    style={{ 
                      lineHeight: 1.8, 
                      marginBottom: 16,
                      color: '#444' 
                    }} 
                    {...props} 
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul 
                    style={{ 
                      paddingLeft: 24, 
                      lineHeight: 1.8,
                      marginBottom: 16 
                    }} 
                    {...props} 
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol 
                    style={{ 
                      paddingLeft: 24, 
                      lineHeight: 1.8,
                      marginBottom: 16 
                    }} 
                    {...props} 
                  />
                ),
                li: ({ node, ...props }) => (
                  <li 
                    style={{ 
                      marginBottom: 8,
                      color: '#444' 
                    }} 
                    {...props} 
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote 
                    style={{
                      borderLeft: '4px solid #d0e0ff',
                      backgroundColor: '#f8faff',
                      padding: '12px 20px',
                      margin: '16px 0',
                      borderRadius: '0 4px 4px 0',
                      color: '#555',
                      fontStyle: 'italic'
                    }} 
                    {...props} 
                  />
                ),
                code: ({ node, inline, ...props }) => {
                  if (inline) {
                    return (
                      <code 
                        style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '2px 6px', 
                          borderRadius: 3,
                          fontFamily: 'monospace',
                          fontSize: '0.9em' 
                        }} 
                        {...props} 
                      />
                    );
                  }
                  return (
                    <pre 
                      style={{ 
                        backgroundColor: '#f6f8fa', 
                        padding: 16, 
                        borderRadius: 6,
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        margin: '16px 0',
                        fontSize: '0.9em',
                        lineHeight: 1.5 
                      }}
                    >
                      <code {...props} />
                    </pre>
                  );
                },
                strong: ({ node, ...props }) => (
                  <strong style={{ color: '#333' }} {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em style={{ color: '#666' }} {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a 
                    style={{ color: '#1890ff' }} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props} 
                  />
                ),
                table: ({ node, ...props }) => (
                  <table 
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      margin: '16px 0',
                      fontSize: '0.9em'
                    }} 
                    {...props} 
                  />
                ),
                th: ({ node, ...props }) => (
                  <th 
                    style={{
                      border: '1px solid #e8e8e8',
                      padding: '8px 12px',
                      backgroundColor: '#fafafa',
                      textAlign: 'left',
                      fontWeight: 600
                    }} 
                    {...props} 
                  />
                ),
                td: ({ node, ...props }) => (
                  <td 
                    style={{
                      border: '1px solid #e8e8e8',
                      padding: '8px 12px'
                    }} 
                    {...props} 
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HomePage;