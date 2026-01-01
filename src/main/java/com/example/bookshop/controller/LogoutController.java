package com.example.bookshop.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

@RestController
@RequestMapping("/api")
public class LogoutController {

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        // 销毁当前会话
        session.invalidate();
        return ResponseEntity.ok(Collections.singletonMap("message", "退出成功"));
    }
}