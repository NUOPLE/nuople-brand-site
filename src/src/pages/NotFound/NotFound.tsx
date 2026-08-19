import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">页面不存在或已被移除</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-sm text-sm"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
