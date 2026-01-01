package com.example.bookshop.service;

import com.example.bookshop.entity.User;
import com.example.bookshop.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public void createUser(String username, String passwordHash) {
        userMapper.insertUser(username, passwordHash);
    }

    public User getByUsername(String username) {
        return userMapper.findByUsername(username);
    }
}