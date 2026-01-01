package com.example.bookshop.controller;

import com.example.bookshop.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // 导入这个
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // 导入这个
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.example.bookshop.entity.*;
import com.example.bookshop.util.Result;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BCryptPasswordEncoder encoder;


    @PostMapping("/register")
    public Result register(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        String confirm = data.get("confirm_password");

        // 校验逻辑...
        if (password == null || password.length() < 8) {
            return Result.error(400, "密码长度不能小于8位");
        }

        String passwordHash = encoder.encode(password);
        try {
            userService.createUser(username, passwordHash);
            return Result.success(null); // 返回 Result 对象
        } catch (Exception e) {
            return Result.error(409, "用户名已存在");
        }
    }

    // ✅ 注意这里：同样改为 Result
    @PostMapping("/login")
    public Result login(@RequestBody Map<String, String> data, HttpSession session) {
        String username = data.get("username");
        String password = data.get("password");

        User user = userService.getByUsername(username);
        if (user == null || !encoder.matches(password, user.getPasswordHash())) {
            return Result.error(401, "用户名或密码错误");
        }

        session.setAttribute("user_id", user.getUserId());
        session.setAttribute("username", user.getUsername());
        return Result.success(null);
    }

    // ✅ 注意这里：也改为 Result
    @GetMapping("/me")
    public Result me(HttpSession session) {
        Object username = session.getAttribute("username");
        if (username == null) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("loggedIn", false);
            return Result.success(fail);
        }
        Map<String, Object> success = new HashMap<>();
        success.put("loggedIn", true);
        success.put("username", username);
        return Result.success(success);
    }
}