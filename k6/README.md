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
DB: 1118 cities, 1367 forecast - при тестировании кол-во прогнозов будет расти
k6: тестовый инструмент
профиль нагрузки: 5 GET-запросов (список городов, конкретный город, список прогнозов, конкретный прогноз, список погоды), 1 POST-запрос (загрузка прогноза для города). Остальные не рассматриваем в силу их малого использования и малой нагрузки на API.
требования: не более 1% ошибок, не более 500ms для 95% пользователей

=====================================================================================================

**Тест 1 Проверка работоспособности приложения - smoke test**
  
    scenarios: (100.00%) 1 scenario, 3 max VUs, 1m30s max duration (incl. graceful stop):
           * default: 3 looping VUs for 1m0s (gracefulStop: 30s)


     data_received..................: 23 MB 358 kB/s
     data_sent......................: 51 kB 815 B/s
     http_req_blocked...............: avg=1.47ms   min=2µs     med=6µs      max=94.69ms p(90)=9µs      p(95)=11µs    
     http_req_connecting............: avg=1.46ms   min=0s      med=0s       max=94.12ms p(90)=0s       p(95)=0s      
     http_req_duration..............: avg=535.5ms  min=72.28ms med=129.98ms max=6.07s   p(90)=1.87s    p(95)=2.55s   
       { expected_response:true }...: avg=535.5ms  min=72.28ms med=129.98ms max=6.07s   p(90)=1.87s    p(95)=2.55s   
     http_req_failed................: 0.00% ✓ 0        ✗ 343
     http_req_receiving.............: avg=113.52ms min=48µs    med=9.73ms   max=1.01s   p(90)=316.51ms p(95)=363.93ms
     http_req_sending...............: avg=48.68µs  min=14µs    med=37µs     max=1.71ms  p(90)=49µs     p(95)=60.89µs 
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s      p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=421.92ms min=72.11ms med=86.03ms  max=5.4s    p(90)=1.56s    p(95)=2.18s   
     http_reqs......................: 343   5.442061/s
     iteration_duration.............: avg=3.78s    min=2.41s   med=3.24s    max=7.28s   p(90)=5.63s    p(95)=6.38s   
     iterations.....................: 49    0.777437/s
     vus............................: 1     min=1      max=3
     vus_max........................: 3     min=3      max=3
     
     running (1m03.0s), 0/3 VUs, 49 complete and 0 interrupted iterations
     default ✓ [======================================] 3 VUs  1m0s

График результата

<img width="1360" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/305a541a-bf53-4178-b6e0-bcf516461c88">

по методу GET:/weatherforecast требования по длительности запроса-ответа значительно превышены
min 1.54s / max 6.07s / p95 5.28s / p99 5.73s ошибок не наблюдалось

<img width="1360" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/5ee517eb-c870-4bff-94d2-f120435abce2">

зафикисрован рост транзакций на DB - вероятная причина не выполнений требований по длительности запрос-ответа

<img width="1360" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/332b99ed-5b1a-4888-8805-0f2347f61acc">

**Тест 2 - Тест на отказ - breakpoint_test**
Условием отказа выбран >1% ошибок и проводится без метода GET:/weatherforecast

     scenarios: (100.00%) 1 scenario, 1000 max VUs, 30m35s max duration (incl. graceful stop):
      * default: Up to 1000 looping VUs for 30m5s over 2 stages (gracefulRampDown: 30s, gracefulStop: 30s)
      
     data_received..................: 1.9 GB 5.9 MB/s
     data_sent......................: 6.6 MB 21 kB/s
     http_req_blocked...............: avg=56.68µs  min=666ns   med=1.66µs   max=39.49ms  p(90)=3.75µs  p(95)=6.18µs 
     http_req_connecting............: avg=53.04µs  min=0s      med=0s       max=36.44ms  p(90)=0s      p(95)=0s     
     http_req_duration..............: avg=409.55ms min=1.67ms  med=128.77ms max=11.87s   p(90)=1.16s   p(95)=1.4s   
       { expected_response:true }...: avg=510.19ms min=2.13ms  med=233.36ms max=11.87s   p(90)=1.27s   p(95)=1.49s  
     ✗ http_req_failed................: 20.41% ✓ 13220     ✗ 51541 
     http_req_receiving.............: avg=11.86ms  min=9.78µs  med=68.65µs  max=601.59ms p(90)=7.53ms  p(95)=99.24ms
     http_req_sending...............: avg=24.83µs  min=3.51µs  med=8.33µs   max=28.39ms  p(90)=21.07µs p(95)=33.42µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s       p(90)=0s      p(95)=0s     
     http_req_waiting...............: avg=397.66ms min=1.63ms  med=125.12ms max=11.87s   p(90)=1.1s    p(95)=1.39s  
     http_reqs......................: 64761  206.42937/s
     iteration_duration.............: avg=1.64s    min=12.64ms med=1.03s    max=16.49s   p(90)=4.01s   p(95)=5.8s   
     iterations.....................: 16126  51.402542/s
     vus............................: 171    min=1       max=171 
     vus_max........................: 1000   min=1000    max=1000
     running (05m13.7s), 0000/1000 VUs, 16126 complete and 172 interrupted iterations
     default ✗ [=====>--------------------------------] 0172/1000 VUs  05m13.7s/30m05.0s
     ERRO[0317] thresholds on metrics 'http_req_failed' were crossed; at least one has abortOnFail enabled, stopping test prematurely 

График результата

<img width="1360" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/aad6b1ef-ef5c-4c80-9cc9-e2a2bcc8dba6">

время отказа 21:15 03/12/23, фиксируется лавинообразный рост ошибок 502

<img width="666" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/2f61a3c6-7060-4250-bc9e-09802df186bc">

по графику HAProxy-Sessions наблюдается полочка при значении 200

<img width="666" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/6c377875-1042-499a-9f82-2a75b287b7dd">

по графику CPU Pods фиксируется максимальная загрузка - фиксируется рестарт PODs в момент отказа

<img width="666" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/970b46df-6af3-4123-9ea5-ab8380524d38">

время команды 21:59 03/12/23

    kubectl get pod sre-course-api-55dc8cc8cb-sw2vr
    NAME                              READY   STATUS    RESTARTS       AGE
    sre-course-api-55dc8cc8cb-sw2vr   1/1     Running   30 (44m ago)   34d
    kubectl get pod sre-course-api-55dc8cc8cb-4tkqf
    NAME                              READY   STATUS    RESTARTS       AGE
    sre-course-api-55dc8cc8cb-4tkqf   1/1     Running   16 (44m ago)   34d

в логах приложения

    [18:15:47 INF] Application started. Press Ctrl+C to shut down.



