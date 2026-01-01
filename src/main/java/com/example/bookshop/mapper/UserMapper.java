package com.example.bookshop.mapper;

import com.example.bookshop.entity.User; // 记得一会儿去 entity 包建 User 类
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {
    // 注册：存入用户名和加密后的密码
    @Insert("INSERT INTO users (username, password_hash) VALUES (#{username}, #{passwordHash})")
    void insertUser(String username, String passwordHash);

    // 登录：根据用户名查用户信息
    @Select("SELECT user_id, username, password_hash FROM users WHERE username = #{username}")
    User findByUsername(String username);
}