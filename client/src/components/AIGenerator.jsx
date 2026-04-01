import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, Button, List, Checkbox, message, Tag, App } from 'antd';
import { generateQuestions, importQuestions } from '../services/api';

const { Option } = Select;

// 修复antd message警告：使用App组件包装
const AIGenerator = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp(); // 使用App组件提供的message
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // 定义parseOptions函数
  const parseOptions = (options) => {
    if (!options) return [];
    
    // 如果已经是数组，直接返回
    if (Array.isArray(options)) return options;
    
    // 如果是字符串，尝试解析
    if (typeof options === 'string') {
      try {
        // 尝试作为JSON解析
        return JSON.parse(options);
      } catch (e) {
        // 如果不是JSON，按逗号分割
        return options.split(',').map(opt => opt.trim());
      }
    }
    
    // 其他情况返回空数组
    return [];
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setGeneratedQuestions([]); // 清空旧数据
      setSelectedQuestions([]);

      const response = await generateQuestions(values);

      // 确保从响应中提取 `data` 字段
      const questions = response.data; 
      if (!questions || !Array.isArray(questions)) {
        message.error('AI返回的数据格式异常');
        return;
      }

      // 更新状态，触发界面重新渲染
      setGeneratedQuestions(questions);
      // 默认全选新生成的题目
      setSelectedQuestions(questions.map((_, idx) => idx));
      
      message.success(`成功生成 ${questions.length} 道题目`);

    } catch (error) {
      message.error('生成失败: ' + (error.message || '请检查网络和API配置'));
    } finally {
      setLoading(false);
    }
  };


  const handleToggleSelect = (index) => {
    setSelectedQuestions(prev => {
      const newSelected = [...prev];
      const idx = newSelected.indexOf(index);
      
      if (idx > -1) {
        newSelected.splice(idx, 1);
      } else {
        newSelected.push(index);
      }
      
      return newSelected.sort((a, b) => a - b);
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    } else {
      setSelectedQuestions([]);
    }
  };

  // AIGenerator.jsx - 修改handleImport函数
const handleImport = async () => {
  if (selectedQuestions.length === 0) {
    message.warning('请选择要导入的题目');
    return;
  }

  try {
    // 获取选中的题目
    const selectedQuestionData = selectedQuestions.map(index => {
      const question = generatedQuestions[index];
      
      // 处理选项格式
      let options = question.options;
      if (Array.isArray(options)) {
        options = JSON.stringify(options);
      } else if (typeof options === 'string') {
        // 如果是逗号分隔的字符串，转换为JSON数组
        if (options.includes(',') && !options.startsWith('[')) {
          options = JSON.stringify(options.split(',').map(opt => opt.trim()));
        }
      }
      
      // 处理答案格式
      let answer = question.answer;
      if (Array.isArray(answer)) {
        answer = JSON.stringify(answer);
      } else if (typeof answer === 'object') {
        answer = JSON.stringify(answer);
      }
      
      return {
        type: question.type,
        title: question.title,
        options: options || '',
        answer: answer || '',
        difficulty: question.difficulty || 'medium',
        language: question.language || null,
        status: 'active',
      };
    });

    // 调用导入API - 使用新增的importQuestions函数
    const response = await importQuestions(selectedQuestionData);
    
    // 根据后端返回的格式调整
    if (response.success || response.message) {
      message.success(response.message || `成功导入 ${selectedQuestionData.length} 道题目到题库`);
      
      // 关闭模态框
      onClose();
      
      // 如果有成功回调，执行它
      if (onSuccess) {
        onSuccess(); // 这会触发QuestionPage的刷新
      }
      
      // 清空状态
      setGeneratedQuestions([]);
      setSelectedQuestions([]);
      form.resetFields();
    } else {
      message.error('导入失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    message.error('导入失败: ' + (error.message || '请检查网络连接'));
  }
};

  const getQuestionTypeText = (type) => {
    const typeMap = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      programming: '编程题',
    };
    return typeMap[type] || '未知';
  };

  const getDifficultyTag = (difficulty) => {
    const difficultyMap = {
      easy: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      hard: { color: 'red', text: '困难' },
    };
    const config = difficultyMap[difficulty] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <Modal
      title="AI出题"
      open={open}
      onCancel={() => {
        onClose();
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        form.resetFields();
      }}
      width={800}
      footer={null}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: 'single_choice',
              difficulty: 'medium',
              num: 5,
            }}
          >
            <Form.Item
              name="type"
              label="题型"
              rules={[{ required: true, message: '请选择题型' }]}
            >
              <Select>
                <Option value="single_choice">单选题</Option>
                <Option value="multiple_choice">多选题</Option>
                <Option value="programming">编程题</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="num"
              label="题目数量"
              rules={[
                { required: true, message: '请输入题目数量' },
                { type: 'number', min: 1, max: 20, message: '数量范围1-20' },
              ]}
            >
              <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="难度"
              rules={[{ required: true, message: '请选择难度' }]}
            >
              <Select>
                <Option value="easy">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="hard">困难</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) => {
                const type = getFieldValue('type');
                return type === 'programming' ? (
                  <Form.Item
                    name="language"
                    label="编程语言"
                    rules={[{ required: true, message: '请选择编程语言' }]}
                  >
                    <Select>
                      <Option value="Go">Go</Option>
                      <Option value="JavaScript">JavaScript</Option>
                      <Option value="Python">Python</Option>
                      <Option value="Java">Java</Option>
                      <Option value="C++">C++</Option>
                    </Select>
                  </Form.Item>
                ) : null;
              }}
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                onClick={handleGenerate} 
                loading={loading}
                block
              >
                生成题目
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div style={{ flex: 2, borderLeft: '1px solid #f0f0f0', paddingLeft: 24 }}>
          {generatedQuestions.length > 0 ? (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  已生成 {generatedQuestions.length} 道题目
                </div>
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  全选
                </Checkbox>
              </div>

              <List
                dataSource={generatedQuestions}
                renderItem={(item, index) => {
                  // 安全解析选项
                  const options = parseOptions(item.options);
                  
                  return (
                    <List.Item
                      key={item._id || index}
                      style={{
                        padding: '12px',
                        border: '1px solid #f0f0f0',
                        marginBottom: 8,
                        borderRadius: 4,
                        background: selectedQuestions.includes(index) ? '#f0f7ff' : 'white',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Checkbox
                          checked={selectedQuestions.includes(index)}
                          onChange={() => handleToggleSelect(index)}
                          style={{ marginRight: 12 }}
                        />
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 8 }}>
                            <Tag style={{ marginRight: 8 }}>
                              {getQuestionTypeText(item.type)}
                            </Tag>
                            {getDifficultyTag(item.difficulty)}
                            {item.language && (
                              <Tag style={{ marginLeft: 8 }}>{item.language}</Tag>
                            )}
                          </div>
                          
                          <div style={{ color: 'rgba(0,0,0,.85)', marginBottom: 4 }}>
                            {item.title}
                          </div>
                          
                          {item.type !== 'programming' && options.length > 0 && (
                            <div style={{ color: 'rgba(0,0,0,.65)', fontSize: 12 }}>
                              选项: {options.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
                style={{ maxHeight: 400, overflow: 'auto' }}
              />

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => setGeneratedQuestions([])}>
                  清空
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleImport}
                  disabled={selectedQuestions.length === 0}
                >
                  导入选中题目 ({selectedQuestions.length})
                </Button>
              </div>
            </>
          ) : (
            <div style={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'rgba(0,0,0,.25)' 
            }}>
              请先生成题目预览
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// 导出包装后的组件
export default function AIGeneratorWrapper(props) {
  return (
    <App>
      <AIGenerator {...props} />
    </App>
  );
}