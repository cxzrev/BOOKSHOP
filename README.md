环境要求
Java 17 或以上版本

MySQL 8.0+

Maven 3.6+

数据库配置
创建名为 bookshop 的数据库。

执行项目根目录下的 database.sql 文件初始化表结构及初始图书数据。

在 src/main/resources/application.properties 中修改你的数据库用户名和密码。

运行说明
在 IDE 中运行 BookshopApplication.java。

在浏览器访问 http://localhost:8080/index.html。

核心功能路径

注册/登录：右上角菜单进入。 


购买流程：首页/搜索页 -> 图书详情页 -> 加入购物篮 -> 购物篮页结算 -> 确认订单页 -> 支付。 


订单查询：登录后点击头像查看历史购买记录。
