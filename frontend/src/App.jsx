import React from "react";
import { Breadcrumb, Layout, Menu, theme } from "antd";
const { Header, Content, Footer } = Layout;

const App = () => {
  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          color: "black",
          backgroundColor: "white",
          height: "5vh",
        }}
      >
        Navigation Panel
      </Header>
      <Content>
        <div
          style={{
            width: "100vw",
            height: "90vh",
          }}
        >
          content
        </div>
      </Content>
    </Layout>
  );
};
export default App;
