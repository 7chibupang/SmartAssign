import React, { useState } from 'react';
import { Layout, Breadcrumb, theme } from 'antd';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Header, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsed={collapsed}
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <Sidebar 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
        />
      </Layout.Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Breadcrumb style={{ marginLeft: 16 }}>
              <Breadcrumb.Item>华中农业大学</Breadcrumb.Item>
              <Breadcrumb.Item>大作业</Breadcrumb.Item>
              <Breadcrumb.Item>
                {location.pathname === '/' ? '学习心得' : '题库管理'}
              </Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          <div style={{ color: 'rgba(0,0,0,.45)' }}>
            马林锐
          </div>
        </Header>
        
        <Content style={{
          margin: '16px',
          padding: 24,
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          overflow: 'auto',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;