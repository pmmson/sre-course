Задача:

1. Разработать профиль нагрузки для системы
2. Реализовать профиль на любом инструменте НТ (разработать скрипт)
3. Задать нефункциональные требования по производительности к системе (SLO/SLA)
4. Найти максимальную производительность системы
5. Написать краткий вывод: где достигнута максимальная производительность, где узкое место в системе, для подтверждения привести графики.

=====================================================================================================

Схема приложения

![image](https://github.com/pmmson/sre-course/assets/43889620/c65493d4-58d7-4a8d-a7e7-57ccb375a47b)

Ресурсы инфраструктуры и версия приложения
версия: tag "f0135e1"
VMs: 6шт ( vCPU 1шт, RAM 2 ГБ )
k8s: replicaCount 2, resources: limits ( cpu: 200m memory: 128Mi ), requests ( cpu: 80m, memory: 64Mi ), autoscaling: false
DB: 1118 cities, 1118 forecast - 1 прогноз на 1 город
k6: тестовый инструмент
профиль нагрузки: в зависимости от теста.
требования: не более 1% ошибок, не более 500ms для 95% пользователей

=====================================================================================================

**Тест 1 Проверка работоспособности приложения - smoke test**

https://github.com/pmmson/sre-course/blob/master/k6/smoke_test.js

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

https://github.com/pmmson/sre-course/blob/master/k6/breakpoint_test.js

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

**Тест 3 - нагрузочный - load test 1**

https://github.com/pmmson/sre-course/blob/master/k6/load_test_1.js

    scenarios: (100.00%) 1 scenario, 120 max VUs, 7m35s max duration (incl. graceful stop):
           * default: Up to 120 looping VUs for 7m5s over 4 stages (gracefulRampDown: 30s, gracefulStop: 30s)
           running (0m46.9s), 084/120 VUs, 2096 complete and 0 interru
           running (0m47.0s), 084/120 VUs, 2099 complete and 0 interru

     data_received..................: 995 MB 5.5 MB/s
     data_sent......................: 3.8 MB 21 kB/s
     http_req_blocked...............: avg=56.01µs  min=640ns   med=1.65µs   max=29.52ms p(90)=4.02µs  p(95)=6.41µs 
     http_req_connecting............: avg=52.51µs  min=0s      med=0s       max=29.22ms p(90)=0s      p(95)=0s     
     http_req_duration..............: avg=471.63ms min=1.64ms  med=92.34ms  max=17.96s  p(90)=1.25s   p(95)=1.39s  
       { expected_response:true }...: avg=632.64ms min=2.24ms  med=202.06ms max=17.96s  p(90)=1.3s    p(95)=1.47s  
    ✗ http_req_failed................: 25.95% ✓ 9684       ✗ 27621
     http_req_receiving.............: avg=11.7ms   min=8.88µs  med=50.08µs  max=2.29s   p(90)=6.03ms  p(95)=99.17ms
     http_req_sending...............: avg=27.82µs  min=3.25µs  med=8.65µs   max=30.51ms p(90)=23.67µs p(95)=39.53µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s      p(90)=0s      p(95)=0s     
     http_req_waiting...............: avg=459.89ms min=1.62ms  med=89.95ms  max=17.96s  p(90)=1.19s   p(95)=1.39s  
     http_reqs......................: 37305  205.015856/s
     iteration_duration.............: avg=1.89s    min=10.62ms med=1.23s    max=20.29s  p(90)=4.09s   p(95)=4.81s  
     iterations.....................: 9284   51.021772/s
     vus............................: 120    min=1        max=120
     vus_max........................: 120    min=120      max=120
     
     running (3m02.0s), 000/120 VUs, 9284 complete and 120 interrupted iterations
     default ✗ [===============>----------------------] 118/120 VUs  3m02.0s/7m05.0s
     ERRO[0185] thresholds on metrics 'http_req_failed' were crossed; at least one has abortOnFail enabled, stopping test prematurely 

<img width="1354" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/f37f6548-e048-40cd-881d-9e52ec58e9fe">

Система не стабильна, как только происходит рестарт одновременно двух подов - фиксируется лавинный рост ошибок

<img width="819" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/6e3546dd-cdae-46e0-8b9b-5c3bacc99464">
<img width="658" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/f90b0d86-68d5-4ade-8cc7-acf60dfad80d">

видимой причиной рестартов подов - достижение предела в 200 сессий на HAProxy

<img width="658" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/8e770f7d-6a11-4509-b4c9-780594e70b0e">

**Тест 3 - нагрузочный - load test 2**

https://github.com/pmmson/sre-course/blob/master/k6/load_test_2.js

100 VUs - успешный результат

    scenarios: (100.00%) 1 scenario, 100 max VUs, 7m35s max duration (incl. graceful stop):
           * default: Up to 100 looping VUs for 7m5s over 4 stages (gracefulRampDown: 30s, gracefulStop: 30s)

     data_received..................: 1.8 GB 4.3 MB/s
     data_sent......................: 5.1 MB 12 kB/s
     http_req_blocked...............: avg=43.23µs  min=746ns   med=1.95µs   max=29.11ms p(90)=4.58µs  p(95)=9.56µs  
     http_req_connecting............: avg=39.1µs   min=0s      med=0s       max=29.04ms p(90)=0s      p(95)=0s      
     http_req_duration..............: avg=715.2ms  min=2.17ms  med=703.35ms max=14.56s  p(90)=1.17s   p(95)=1.39s   
       { expected_response:true }...: avg=715.58ms min=2.17ms  med=703.46ms max=14.56s  p(90)=1.17s   p(95)=1.39s   
    ✓ http_req_failed................: 0.13%  ✓ 69         ✗ 50503
     http_req_receiving.............: avg=22.26ms  min=12.03µs med=401.36µs max=1.5s    p(90)=99.58ms p(95)=113.75ms
     http_req_sending...............: avg=25.03µs  min=4.35µs  med=10µs     max=34.94ms p(90)=28.44µs p(95)=44.97µs 
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s      p(90)=0s      p(95)=0s      
     http_req_waiting...............: avg=692.91ms min=2.1ms   med=697.68ms max=14.36s  p(90)=1.1s    p(95)=1.3s    
     http_reqs......................: 50572  118.969077/s
     iteration_duration.............: avg=2.86s    min=14.61ms med=2.55s    max=18.16s  p(90)=4.46s   p(95)=6.01s   
     iterations.....................: 12643  29.742269/s
     vus............................: 1      min=1        max=100
     vus_max........................: 100    min=100      max=100
     
     running (7m05.1s), 000/100 VUs, 12643 complete and 0 interrupted iterations
     default ✓ [======================================] 000/100 VUs  7m5s

<img width="1355" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/27cf8f51-f04a-4e5b-bb6e-1ab064d45bc5">

кол-во ошибок в допустимых пределах http_req_failed: 0.13%  ✓ 69
<img width="674" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/a3af8483-d43e-4ce3-9b2e-6fd25bfc7cef">
длительность запрос-ответа более 500ms
фиксировался рестарт только одного пода, по кол-ву сессий предел в 200 не был превышен
<img width="658" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/c485c439-b5ac-4225-9ccc-b357f9c6b67e">
<img width="674" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/991774b9-583e-462a-82da-ec5bdfce3fc7">

**Тест 4 - Стресс тест**

https://github.com/pmmson/sre-course/blob/master/k6/stress_test.js

При вроедении теста зафиксированы множественные ошибки со стороны Prometheus
ERRO[0256] Failed to send the time series data to the endpoint  error="HTTP POST request failed: Post \"http://10.10.10.2:9090/api/v1/write\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)" output="Prometheus remote write"
WARN[0256] Successful flushed time series to remote write endpoint but it took 5.952150602s while flush period is 5s. Some samples may be dropped.  nts=130339 output="Prometheus remote write"

    scenarios: (100.00%) 1 scenario, 300 max VUs, 7m45s max duration (incl. graceful stop):
      * default: Up to 300 looping VUs for 7m15s over 8 stages (gracefulRampDown: 30s, gracefulStop: 30s)

     data_received..................: 1.5 GB  3.5 MB/s
     data_sent......................: 114 MB  261 kB/s
     http_req_blocked...............: avg=270.42µs min=590ns    med=932ns   max=1.26s    p(90)=1.71µs   p(95)=2.66µs  
     http_req_connecting............: avg=268.46µs min=0s       med=0s      max=1.26s    p(90)=0s       p(95)=0s      
     http_req_duration..............: avg=29.03ms  min=339.2µs  med=7.22ms  max=13.36s   p(90)=40.84ms  p(95)=96.77ms 
       { expected_response:true }...: avg=372.66ms min=2.25ms   med=42.51ms max=13.36s   p(90)=195.35ms p(95)=2.88s   
     http_req_failed................: 97.18%  ✓ 1088527     ✗ 31501
     http_req_receiving.............: avg=260.45µs min=7.75µs   med=13.06µs max=501.77ms p(90)=24.97µs  p(95)=38.31µs 
     http_req_sending...............: avg=79.85µs  min=2.97µs   med=4.8µs   max=242.55ms p(90)=9.73µs   p(95)=15.63µs 
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s      max=0s       p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=28.69ms  min=323.49µs med=7.1ms   max=13.36s   p(90)=39.99ms  p(95)=95.49ms 
     http_reqs......................: 1120028 2574.773386/s
     iteration_duration.............: avg=117.4ms  min=1.86ms   med=39.25ms max=25.59s   p(90)=219.24ms p(95)=283.71ms
     iterations.....................: 280007  643.693347/s
     vus............................: 1       min=1         max=300
     vus_max........................: 300     min=300       max=300
     
     running (7m15.0s), 000/300 VUs, 280007 complete and 0 interrupted iterations
     default ✓ [======================================] 000/300 VUs  7m15s

получить данные с Prometheus не представляется возможным - вся память 2Gb и весь swap 2Gb утилизированы
Так как Prometheus соседствует с HAProxy - было оказано влияние и на приложение
