import React from 'react';
import { Menu, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  DatabaseOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/questions') return 'questions';
    return 'home';
  };

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '学习心得',
      onClick: () => navigate('/'),
    },
    {
      key: 'questions',
      icon: <DatabaseOutlined />,
      label: '题库管理',
      onClick: () => navigate('/questions'),
    },
    {
      key: 'divider1',
      type: 'divider',
    },
    {
      key: 'create-manual',
      icon: <PlusCircleOutlined />,
      label: '手工出题',
      onClick: () => {
        if (window.location.pathname === '/questions') {
          window.dispatchEvent(new CustomEvent('openQuestionForm'));
        } else {
          navigate('/questions');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openQuestionForm'));
          }, 100);
        }
      },
    },
    {
      key: 'create-ai',
      icon: <QuestionCircleOutlined />,
      label: 'AI出题',
      onClick: () => {
        if (window.location.pathname === '/questions') {
          window.dispatchEvent(new CustomEvent('openAIGenerator'));
        } else {
          navigate('/questions');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openAIGenerator'));
          }, 100);
        }
      },
    },
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部Logo区域 */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fff',
      }}>
        {!collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16,
            }}>
              题
            </div>
            <span style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: '#1890ff',
              whiteSpace: 'nowrap',
            }}>
              题库管理系统
            </span>
          </div>
        )}

        {collapsed && (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
          }}>
            题
          </div>
        )}

        {!collapsed && (
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={() => onCollapse(true)}
            style={{ width: 32, height: 32 }}
          />
        )}
      </div>

      {/* 菜单区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px 0',
        backgroundColor: '#fff',
      }}>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          inlineCollapsed={collapsed}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
          }}
          theme="light"
        />
      </div>

      {/* 底部折叠按钮（仅折叠时显示） */}
      {collapsed && (
        <div style={{
          padding: '16px 0',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}>
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => onCollapse(false)}
            style={{ width: 32, height: 32 }}
          />
        </div>
      )}

      {/* 底部信息（展开时显示） */}
      {!collapsed && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          fontSize: 12,
          color: '#8c8c8c',
          textAlign: 'center',
        }}>
          <div>华中农业大学</div>
          <div>马林锐</div>
          <div style={{ marginTop: 4 }}>大作业</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
