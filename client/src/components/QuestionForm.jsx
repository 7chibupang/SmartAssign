import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { createQuestion, updateQuestion } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

const QuestionForm = ({ open, onClose, question, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState('single_choice');

  useEffect(() => {
    if (question && open) {
      // 编辑模式
      try {
        const formattedQuestion = { ...question };
        
        // 处理选项
        if (question.options) {
          try {
            const parsedOptions = JSON.parse(question.options);
            formattedQuestion.options = Array.isArray(parsedOptions) ? parsedOptions : ['', '', '', ''];
          } catch (e) {
            formattedQuestion.options = ['', '', '', ''];
          }
        } else {
          formattedQuestion.options = ['', '', '', ''];
        }
        
        // 处理答案
        if (question.answer) {
          try {
            formattedQuestion.answer = JSON.parse(question.answer);
          } catch (e) {
            formattedQuestion.answer = question.type === 'single_choice' ? '' : [];
          }
        } else {
          formattedQuestion.answer = question.type === 'single_choice' ? '' : [];
        }
        
        form.setFieldsValue(formattedQuestion);
        setQuestionType(question.type);
      } catch (error) {
        // 如果出错，重置表单
        form.resetFields();
        form.setFieldsValue({
          type: 'single_choice',
          difficulty: 'medium',
          options: ['选项1', '选项2', '选项3', '选项4'],
          answer: '',
        });
        setQuestionType('single_choice');
      }
    } else if (open) {
      // 新建模式
      form.resetFields();
      form.setFieldsValue({
        type: 'single_choice',
        difficulty: 'medium',
        options: ['选项A内容', '选项B内容', '选项C内容', '选项D内容'],
        answer: 'A',
      });
      setQuestionType('single_choice');
    }
  }, [question, form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理选项和答案
      let processedValues = { ...values };
      
      if (questionType !== 'programming') {
        // 获取选项值
        const options = values.options || [];
        
        // 检查选项是否足够
        if (options.length < 2) {
          message.error('至少需要两个选项');
          return;
        }
        
        // 过滤掉完全为空的选项（包括只有空格的）
        const nonEmptyOptions = options
          .map(opt => (opt || '').toString().trim())
          .filter(opt => opt !== '');
        
        if (nonEmptyOptions.length < 2) {
          message.error('至少需要两个非空选项（不能全是空格）');
          return;
        }
        
        // 使用过滤后的选项
        processedValues.options = JSON.stringify(nonEmptyOptions);
        
        // 验证答案是否存在
        if (!values.answer || 
            (Array.isArray(values.answer) && values.answer.length === 0)) {
          message.error('请选择正确答案');
          return;
        }
        
        // 确保答案是有效的（在选项范围内）
        const validOptions = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, nonEmptyOptions.length);
        if (questionType === 'single_choice') {
          if (!validOptions.includes(values.answer)) {
            message.error(`正确答案必须在 A-${String.fromCharCode(64 + nonEmptyOptions.length)} 之间`);
            return;
          }
        } else if (questionType === 'multiple_choice') {
          const invalidAnswers = values.answer.filter(a => !validOptions.includes(a));
          if (invalidAnswers.length > 0) {
            message.error(`正确答案必须在 A-${String.fromCharCode(64 + nonEmptyOptions.length)} 之间`);
            return;
          }
        }
        
        processedValues.answer = JSON.stringify(values.answer);
      } else {
        // 编程题没有选项
        processedValues.options = undefined;
        processedValues.answer = undefined;
        
        // 确保编程题有语言
        if (!processedValues.language) {
          processedValues.language = 'Go';
        }
      }

      setLoading(true);
      
      // 确保题目内容不为空
      if (!processedValues.title || processedValues.title.trim() === '') {
        message.error('题目内容不能为空');
        setLoading(false);
        return;
      }

      if (question) {
        // 编辑模式
        await updateQuestion(question.id, processedValues);
        message.success('更新成功');
      } else {
        // 创建模式
        await createQuestion(processedValues);
        message.success('创建成功');
      }
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      // 更详细的错误提示
      if (error.errorFields && error.errorFields.length > 0) {
        const fieldErrors = error.errorFields.map(field => field.errors.join(', ')).join('; ');
        message.error(`表单验证失败: ${fieldErrors}`);
      } else {
        message.error(error.message || '提交失败，请检查表单');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value) => {
    setQuestionType(value);
    // 如果是编程题，清除选项相关的验证
    if (value === 'programming') {
      form.setFieldsValue({
        options: undefined,
        answer: undefined,
        language: form.getFieldValue('language') || 'Go',
      });
    } else {
      // 如果是选择题，设置默认选项
      form.setFieldsValue({
        options: ['', '', '', ''],
        language: undefined,
      });
    }
  };

  return (
    <Modal
      title={question ? '编辑题目' : '手工出题'}
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          确定
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'single_choice',
          difficulty: 'medium',
          options: ['', '', '', ''],
        }}
      >
        <Form.Item
          name="type"
          label="题型"
          rules={[{ required: true, message: '请选择题型' }]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="single_choice">单选题</Option>
            <Option value="multiple_choice">多选题</Option>
            <Option value="programming">编程题</Option>
          </Select>
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

        {questionType === 'programming' && (
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
        )}

        <Form.Item
          name="title"
          label="题目内容"
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入题目内容..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        {questionType !== 'programming' && (
          <>
            <Form.Item label="选项" required>
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Space
                        key={field.key}
                        style={{ display: 'flex', marginBottom: 8 }}
                        align="baseline"
                      >
                        <Form.Item
                          {...field}
                          style={{ margin: 0, flex: 1 }}
                          rules={[
                            { 
                              required: true, 
                              message: '选项内容不能为空',
                              whitespace: true, // 不允许纯空格
                            },
                            { 
                              max: 200, 
                              message: '选项最多200个字符' 
                            },
                            {
                              validator: (_, value) => {
                                if (value && value.trim() === '') {
                                  return Promise.reject(new Error('选项不能全是空格'));
                                }
                                return Promise.resolve();
                              }
                            }
                          ]}
                          validateTrigger={['onChange', 'onBlur']}
                        >
                          <Input
                            placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                            style={{ width: '100%' }}
                            addonBefore={`${String.fromCharCode(65 + index)}.`}
                            allowClear
                          />
                        </Form.Item>
                        {fields.length > 2 && (
                          <MinusCircleOutlined 
                            onClick={() => remove(field.name)} 
                            style={{ color: '#ff4d4f', marginLeft: 8 }}
                          />
                        )}
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add('')}
                      block
                      icon={<PlusOutlined />}
                      style={{ marginTop: 8 }}
                    >
                      添加选项
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item
              name="answer"
              label={questionType === 'single_choice' ? '正确答案' : '正确答案（可多选）'}
              rules={[{ required: true, message: '请选择正确答案' }]}
            >
              {questionType === 'single_choice' ? (
                <Select placeholder="请选择正确答案">
                  {form.getFieldValue('options')?.map((option, index) => (
                    <Option key={index} value={String.fromCharCode(65 + index)}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Option>
                  ))}
                </Select>
              ) : (
                <Select mode="multiple" placeholder="请选择正确答案（可多选）">
                  {form.getFieldValue('options')?.map((option, index) => (
                    <Option key={index} value={String.fromCharCode(65 + index)}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default QuestionForm;