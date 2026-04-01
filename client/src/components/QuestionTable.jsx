import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Popconfirm, 
  message, 
  Modal
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { getQuestions, deleteQuestion, batchDeleteQuestions } from '../services/api';

const { Search } = Input;
const { Option } = Select;

const QuestionTable = ({ onEdit, refreshKey, onRefresh }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    type: '',
    keyword: '',
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeMap = {
          single_choice: { text: '单选题', color: 'blue' },
          multiple_choice: { text: '多选题', color: 'green' },
          programming: { text: '编程题', color: 'orange' },
        };
        const config = typeMap[type] || { text: '未知', color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: '单选题', value: 'single_choice' },
        { text: '多选题', value: 'multiple_choice' },
        { text: '编程题', value: 'programming' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty) => {
        const difficultyMap = {
          easy: { text: '简单', color: 'green' },
          medium: { text: '中等', color: 'orange' },
          hard: { text: '困难', color: 'red' },
        };
        const config = difficultyMap[difficulty] || { text: '未知', color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: '简单', value: 'easy' },
        { text: '中等', value: 'medium' },
        { text: '困难', value: 'hard' },
      ],
      onFilter: (value, record) => record.difficulty === value,
    },
    {
      title: '编程语言',
      dataIndex: 'language',
      key: 'language',
      width: 120,
      render: (language) => language || '-',
    },
    {
      title: '题目内容',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            style={{ color: '#1890ff' }}
          />
          <Popconfirm
            title="确定要删除这道题目吗？"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchQuestions = async () => {
  setLoading(true);
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...filters,
    };
    
    const response = await getQuestions(params);
    
    // 按ID升序排序
    const sortedData = [...(response.data || [])].sort((a, b) => {
      return a.id - b.id;
    });
    
    setQuestions(sortedData);
    setPagination(prev => ({
      ...prev,
      total: response.total,
    }));
  } catch (error) {
    message.error('加载题目失败');
  } finally {
    setLoading(false);
  }
 };

  useEffect(() => {
    fetchQuestions();
  }, [pagination.current, pagination.pageSize, filters, refreshKey]);

  const handleDelete = async (id) => {
    try {
      await deleteQuestion(id);
      message.success('删除成功');
      fetchQuestions();
      if (onRefresh) onRefresh();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的题目');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 道题目吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await batchDeleteQuestions(selectedRowKeys);
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchQuestions();
          if (onRefresh) onRefresh();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleTableChange = (newPagination, filters) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    
    // 处理筛选器变化
    const newFilters = { ...filters };
    if (filters.type && filters.type.length > 0) {
      newFilters.type = filters.type[0];
    } else {
      newFilters.type = '';
    }
    setFilters(newFilters);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            placeholder="筛选题型"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters({ ...filters, type: value })}
            value={filters.type || undefined}
          >
            <Option value="single_choice">单选题</Option>
            <Option value="multiple_choice">多选题</Option>
            <Option value="programming">编程题</Option>
          </Select>
          
          <Search
            placeholder="搜索题目"
            allowClear
            style={{ width: 250 }}
            onSearch={(value) => setFilters({ ...filters, keyword: value })}
            enterButton={<SearchOutlined />}
          />
        </Space>
        
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" onClick={() => onEdit(null)}>
            手工出题
          </Button>
          <Button type="primary" onClick={() => window.dispatchEvent(new CustomEvent('openAIGenerator'))}>
            AI出题
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={questions}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        scroll={{ x: 800 }}
      />
    </div>
  );
};

export default QuestionTable;