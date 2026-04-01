import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = '请求失败';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = '参数错误';
          break;
        case 401:
          errorMessage = '未授权';
          break;
        case 403:
          errorMessage = '禁止访问';
          break;
        case 404:
          errorMessage = '资源不存在';
          break;
        case 500:
          errorMessage = '服务器错误';
          break;
        default:
          errorMessage = `请求失败: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络';
    } else {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// ========== 题目管理 API ==========

// 获取题目列表（分页、筛选）
export const getQuestions = (params) => {
  return apiClient.get('/questions', { params });
};

// 创建单个题目
export const createQuestion = (data) => {
  return apiClient.post('/questions', data);
};

// 更新题目
export const updateQuestion = (id, data) => {
  return apiClient.put(`/questions/${id}`, data);
};

// 删除单个题目
export const deleteQuestion = (id) => {
  return apiClient.delete(`/questions/${id}`);
};

// 批量删除题目
export const batchDeleteQuestions = (ids) => {
  return apiClient.post('/questions/batch-delete', { ids });
};

// ========== AI出题 API ==========

// AI生成题目
export const generateQuestions = async (params) => {
  try {
    const response = await apiClient.post('/ai/generate', params);

    // 确保返回的数据格式正确
    if (!response.data) {
      response.data = [];
    }
    if (!Array.isArray(response.data)) {
      if (response.data && typeof response.data === 'object') {
        response.data = [response.data];
      } else {
        response.data = [];
      }
    }

    return response;
  } catch (error) {
    throw new Error('AI生成失败: ' + (error.message || '请检查网络连接和API配置'));
  }
};

// 批量导入AI生成的题目到题库
export const importQuestions = async (questions) => {
  const processedQuestions = questions.map(question => {
    let options = question.options;
    if (Array.isArray(options)) {
      options = JSON.stringify(options);
    } else if (typeof options === 'string') {
      if (options.includes(',') && !options.startsWith('[')) {
        options = JSON.stringify(options.split(',').map(opt => opt.trim()));
      }
    }

    let answer = question.answer;
    if (Array.isArray(answer)) {
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

  try {
    return await apiClient.post('/questions/batch', { questions: processedQuestions });
  } catch (error) {
    throw new Error('导入题目失败: ' + (error.message || '请检查网络连接'));
  }
};

// ========== 学习心得 API ==========

// 获取学习心得
export const getLearningNote = () => {
  return apiClient.get('/learning-note');
};

// 更新学习心得
export const updateLearningNote = (data) => {
  return apiClient.post('/learning-note/update', data);
};
