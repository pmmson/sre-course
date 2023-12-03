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
DB: 1118 cities, 1118 forecast - 1 прогноз на 1 город
k6: тестовый инструмент
профиль нагрузки: в зависимости от теста.
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
<img width="666" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/5707a531-7be4-4edc-8051-580a114fad22">

время команды 21:59 03/12/23

    kubectl get pod sre-course-api-55dc8cc8cb-sw2vr
    NAME                              READY   STATUS    RESTARTS       AGE
    sre-course-api-55dc8cc8cb-sw2vr   1/1     Running   30 (44m ago)   34d
    kubectl get pod sre-course-api-55dc8cc8cb-4tkqf
    NAME                              READY   STATUS    RESTARTS       AGE
    sre-course-api-55dc8cc8cb-4tkqf   1/1     Running   16 (44m ago)   34d

в логах приложения

    [18:15:47 INF] Application started. Press Ctrl+C to shut down.

Для следующего теста - нагрузочного, берем ~80% от предыдущего результата - 120 VUs, 300rps

**Тест 3 - нагрузочный - load test**

    scenarios: (100.00%) 1 scenario, 120 max VUs, 17m35s max duration (incl. graceful stop):
           * default: Up to 120 looping VUs for 17m5s over 4 stages (gracefulRampDown: 30s, gracefulStop: 30s)

ERRO[0252] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0252] Successful flushed time series to remote write endpoint but it took 7.257531833s while flush period is 5s. Some samples may be dropped.  nts=129585 output="Prometheus remote write"
ERRO[0276] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0276] Successful flushed time series to remote write endpoint but it took 6.239799567s while flush period is 5s. Some samples may be dropped.  nts=133703 output="Prometheus remote write"
ERRO[0284] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0284] Successful flushed time series to remote write endpoint but it took 7.828915145s while flush period is 5s. Some samples may be dropped.  nts=233985 output="Prometheus remote write"
ERRO[0334] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0335] Successful flushed time series to remote write endpoint but it took 50.448753465s while flush period is 5s. Some samples may be dropped.  nts=130687 output="Prometheus remote write"
WARN[0371] Request Failed                                error="Get \"http://91.185.85.213/forecast\": request timeout"
ERRO[0501] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0501] Successful flushed time series to remote write endpoint but it took 2m45.870453278s while flush period is 5s. Some samples may be dropped.  nts=134457 output="Prometheus remote write"
ERRO[0507] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0507] Successful flushed time series to remote write endpoint but it took 6.365340698s while flush period is 5s. Some samples may be dropped.  nts=143679 output="Prometheus remote write"
ERRO[0512] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0512] Successful flushed time series to remote write endpoint but it took 5.070048091s while flush period is 5s. Some samples may be dropped.  nts=5407 output="Prometheus remote write"
ERRO[0520] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0520] Successful flushed time series to remote write endpoint but it took 7.948045635s while flush period is 5s. Some samples may be dropped.  nts=132717 output="Prometheus remote write"
ERRO[0529] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0529] Successful flushed time series to remote write endpoint but it took 8.674633244s while flush period is 5s. Some samples may be dropped.  nts=189035 output="Prometheus remote write"
ERRO[0548] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0548] Successful flushed time series to remote write endpoint but it took 18.78222536s while flush period is 5s. Some samples may be dropped.  nts=129585 output="Prometheus remote write"
ERRO[0555] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0555] Successful flushed time series to remote write endpoint but it took 6.918993166s while flush period is 5s. Some samples may be dropped.  nts=129759 output="Prometheus remote write"
ERRO[0562] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0562] Successful flushed time series to remote write endpoint but it took 7.502000545s while flush period is 5s. Some samples may be dropped.  nts=129759 output="Prometheus remote write"
ERRO[0574] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0575] Successful flushed time series to remote write endpoint but it took 12.643327737s while flush period is 5s. Some samples may be dropped.  nts=129759 output="Prometheus remote write"
ERRO[0612] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0612] Successful flushed time series to remote write endpoint but it took 37.162915102s while flush period is 5s. Some samples may be dropped.  nts=120943 output="Prometheus remote write"
ERRO[0641] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0641] Successful flushed time series to remote write endpoint but it took 29.319242708s while flush period is 5s. Some samples may be dropped.  nts=254401 output="Prometheus remote write"
ERRO[0798] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0798] Successful flushed time series to remote write endpoint but it took 2m35.798988157s while flush period is 5s. Some samples may be dropped.  nts=129759 output="Prometheus remote write"
ERRO[0808] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0808] Successful flushed time series to remote write endpoint but it took 10.401955452s while flush period is 5s. Some samples may be dropped.  nts=129759 output="Prometheus remote write"
ERRO[0961] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0961] Successful flushed time series to remote write endpoint but it took 2m32.508945268s while flush period is 5s. Some samples may be dropped.  nts=129353 output="Prometheus remote write"
ERRO[1059] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[1059] Successful flushed time series to remote write endpoint but it took 1m38.677343011s while flush period is 5s. Some samples may be dropped.  nts=199127 output="Prometheus remote write"
ERRO[1065] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[1065] Successful flushed time series to remote write endpoint but it took 5.443998144s while flush period is 5s. Some samples may be dropped.  nts=73731 output="Prometheus remote write"

     data_received..................: 1.4 GB  1.3 MB/s
     data_sent......................: 110 MB  108 kB/s
     http_req_blocked...............: avg=867.68µs min=596ns    med=1µs      max=3.85s  p(90)=2.28µs   p(95)=3.99µs  
     http_req_connecting............: avg=646.04µs min=0s       med=0s       max=2.97s  p(90)=0s       p(95)=0s      
    ✓ http_req_duration..............: avg=102.66ms min=429.03µs med=11.01ms  max=1m2s   p(90)=195.02ms p(95)=484.22ms
       { expected_response:true }...: avg=1.39s    min=2.14ms   med=671.71ms max=21.02s p(90)=3.39s    p(95)=6.56s   
    ✗ http_req_failed................: 97.35%  ✓ 1058777     ✗ 28719
     http_req_receiving.............: avg=3.23ms   min=0s       med=14.04µs  max=7.92s  p(90)=31.69µs  p(95)=65.83µs 
     http_req_sending...............: avg=868.92µs min=3.14µs   med=5.12µs   max=5.1s   p(90)=12.4µs   p(95)=19.21µs 
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s       max=0s     p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=98.56ms  min=398.41µs med=10.86ms  max=1m2s   p(90)=190.27ms p(95)=470.35ms
     http_reqs......................: 1087496 1060.506325/s
     iteration_duration.............: avg=424.56ms min=2.23ms   med=41.67ms  max=1m7s   p(90)=986.82ms p(95)=2.17s   
     iterations.....................: 271874  265.126581/s
     vus............................: 2       min=1         max=120
     vus_max........................: 120     min=120       max=120
     running (17m05.4s), 000/120 VUs, 271874 complete and 0 interrupted iterations
     default ✓ [======================================] 000/120 VUs  17m5s


