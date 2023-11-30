Задача:

1. Разработать профиль нагрузки для системы
2. Реализовать профиль на любом инструменте НТ (разработать скрипт)
3. Задать нефункциональные требования по производительности к системе (SLO/SLA)
4. Найти максимальную производительность системы
5. Написать краткий вывод: где достигнута максимальная производительность, где узкое место в системе, для подтверждения привести графики.

=====================================================================================================

Схема приложения
![image](https://github.com/pmmson/sre-course/assets/43889620/c65493d4-58d7-4a8d-a7e7-57ccb375a47b)

Ресурсы инфраструктуры
VMs: 6шт ( vCPU 1шт, RAM 2 ГБ )
k8s: replicaCount 2, resources: limits ( cpu: 200m memory: 128Mi ), requests ( cpu: 80m, memory: 64Mi ), autoscaling: false
DB: 1118 cities, 1118 forecast - первичные тестовые данные - 1 прогноз на 1 город
k6: тестовый инструмент
требования: не более 1% ошибок, не более 700ms для 95% пользователей

=====================================================================================================

Тест 1 Проверка работоспособности приложения
  scenarios: (100.00%) 1 scenario, 3 max VUs, 1m30s max duration (incl. graceful stop):
           * default: 3 looping VUs for 1m0s (gracefulStop: 30s)


     data_received..................: 11 MB 171 kB/s
     data_sent......................: 21 kB 342 B/s
     http_req_blocked...............: avg=1.72ms   min=2µs     med=6µs     max=169.75ms p(90)=8µs      p(95)=9µs     
     http_req_connecting............: avg=1.67ms   min=0s      med=0s      max=166.77ms p(90)=0s       p(95)=0s      
     http_req_duration..............: avg=908.21ms min=77.37ms med=89.11ms max=3.46s    p(90)=2.88s    p(95)=3.09s   
       { expected_response:true }...: avg=908.21ms min=77.37ms med=89.11ms max=3.46s    p(90)=2.88s    p(95)=3.09s   
     http_req_failed................: 0.00% ✓ 0        ✗ 201
     http_req_receiving.............: avg=81.53ms  min=46µs    med=110µs   max=313.69ms p(90)=249.47ms p(95)=253.88ms
     http_req_sending...............: avg=44.5µs   min=12µs    med=33µs    max=1.23ms   p(90)=43µs     p(95)=53µs    
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s      max=0s       p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=826.63ms min=77.25ms med=88.68ms max=3.21s    p(90)=2.64s    p(95)=2.85s   
     http_reqs......................: 201   3.252119/s
     iteration_duration.............: avg=2.73s    min=1.62s   med=2.81s   max=3.74s    p(90)=3.36s    p(95)=3.56s   
     iterations.....................: 67    1.08404/s
     vus............................: 1     min=1      max=3
     vus_max........................: 3     min=3      max=3


running (1m01.8s), 0/3 VUs, 67 complete and 0 interrupted iterations
default ✓ [======================================] 3 VUs  1m0s
![image](https://github.com/pmmson/sre-course/assets/43889620/12ca0d18-69e2-4b92-8fbe-8a9891168603)
по методу GET:/weatherforecast требования по длительности запроса-ответа значительно превышены
min 1.47s / max 3.47s / p95 3.39s / p99 3.46s ошибок не наблюдалось
![image](https://github.com/pmmson/sre-course/assets/43889620/c8ffb136-99a1-4bdd-a6d7-a2c99e4d134d)
зафикисрован рост транзакций на DB - вероятная причина не выполнений требований по длительности запрос-ответа
![image](https://github.com/pmmson/sre-course/assets/43889620/8d3a0446-0bb3-409e-8c8a-487f00b2e21f)


