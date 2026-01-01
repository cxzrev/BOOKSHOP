package com.example.bookshop.controller;

import com.example.bookshop.mapper.OrderMapper;
import com.example.bookshop.util.Result;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.bookshop.service.OrderService;
@RestController
@RequestMapping("/api")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderMapper orderMapper;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Integer> cart, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("user_id");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "请先登录"));
        }

        try {
            orderService.checkout(userId, cart);
            return ResponseEntity.ok(Collections.singletonMap("message", "下单成功！"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @GetMapping("/orders")
    public ResponseEntity<?> getOrderHistory(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("user_id");
        if (userId == null) return ResponseEntity.status(401).body(Collections.singletonMap("error", "请先登录"));

        try {
            // 直接返回原始列表，让前端去按订单ID聚合，不要在后端做分组了，避免 null 导致 500
            List<Map<String, Object>> rawData = orderMapper.getOrderHistoryRaw(userId);
            return ResponseEntity.ok(rawData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.singletonMap("error", "查询失败"));
        }
    }
}