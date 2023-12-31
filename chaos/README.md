Задача:

1. Отключение узла: Планово остановить один из узлов кластера, чтобы проверить процедуру
переключения ролей (failover). - Анализировать время, необходимое для восстановления и как
система выбирает новый Master узел (и есть ли вообще там стратегия выбора?).
2. Имитация частичной потери сети: Использовать инструменты для имитации потери пакетов
или разрыва TCP-соединений между узлами. Цель — проверить, насколько хорошо система
справляется с временной недоступностью узлов и как быстро восстанавливается репликация.
3. Высокая нагрузка на CPU или I/O: Запустить процессы, которые создают высокую нагрузку на CPU или дисковую подсистему одного из узлов кластера, чтобы проверить, как это влияет на
производительность кластера в целом и на работу Patroni.
4. Тестирование систем мониторинга и оповещения: С помощью chaos engineering можно также
проверить, насколько эффективны системы мониторинга и оповещения. Например, можно
искусственно вызвать отказ, который должен быть зарегистрирован системой мониторинга, и
убедиться, что оповещения доставляются вовремя ?

Если сделали все предыдущие:
1. ”Split-brain": Одновременно изолировать несколько узлов от сети и дать им возможность
объявить себя новыми мастер-узлами. Проверить, успеет ли Patroni достичь
консенсуса и избежать ситуации "split-brain".
2. Долгосрочная изоляция: Оставить узел изолированным от кластера на длительное время, затем восстановить соединение и наблюдать за процессом синхронизации и
восстановления реплики.
3. Сбои сервисов зависимостей: Изучить поведение кластера Patroni при сбоях в сопутствующих сервисах, например, etcd (которые используются для хранения состояния кластера),
путем имитации его недоступности или некорректной работы.

Формат сдачи ДЗ:
Ссылка на репозиторий, где размещен md файлс с описанием экспериментов и результатами

1. Описание эксперимента: Подробные шаги, которые были предприняты для
имитации условий эксперимента. - Инструменты и методы, применяемые в
процессе.
2. Ожидаемые результаты: Описание ожидаемого поведения системы в ответ
на условия эксперимента.
3. Реальные результаты: Что произошло на самом деле в ходе эксперимента.
Логи, метрики и выводы систем мониторинга и логирования.
4. Анализ результатов: Подробное сравнение ожидаемых и реальных
результатов. - Обсуждение возможных причин отклонений.
===============================================================================================

Проверяем работу кластера ETCD и его влияние на работу приложения

!! Вывод одного узла из кластера !!
Фиксируем текущее состояние. Останавливаем службу ETCD на мастере. Провереям выбран ли новый лидер и кто он. Возвращаем остановленную ноду etcd в кластер. Фиксируем результат, проверяем алертинг системы мониторинга.

Текущий лидер

etcdctl member list
9c18c4e81a122999, started, sre-etcd-03, http://10.10.10.5:2380, http://10.10.10.5:2379, false
a9e63cb3360066aa, started, sre-etcd-01, http://10.10.10.3:2380, http://10.10.10.3:2379, false
b3e79132cbed1a84, started, sre-etcd-02, http://10.10.10.4:2380, http://10.10.10.4:2379, false
etcdctl endpoint status --cluster -w table --endpoints http://10.10.10.3:2379
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| http://10.10.10.5:2379 | 9c18c4e81a122999 |   3.5.9 |  479 kB |     false |      false |         8 |       1647 |               1647 |        |
| http://10.10.10.3:2379 | a9e63cb3360066aa |   3.5.9 |  475 kB |      true |      false |         8 |       1647 |               1647 |        |
| http://10.10.10.4:2379 | b3e79132cbed1a84 |   3.5.9 |  475 kB |     false |      false |         8 |       1647 |               1647 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+

Останавливаем мастер ноду и видим что мастер изменен, но кластер продолжает жить
etcdctl endpoint status --cluster -w table --endpoints http://10.10.10.4:2379
{"level":"warn","ts":"2023-12-12T18:08:36.103604Z","logger":"etcd-client","caller":"v3@v3.5.9/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"etcd-endpoints://0xc0002c6a80/10.10.10.4:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = latest balancer error: last connection error: connection error: desc = \"transport: Error while dialing dial tcp 10.10.10.3:2379: connect: connection refused\""}
Failed to get the status of endpoint http://10.10.10.3:2379 (context deadline exceeded)
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| http://10.10.10.5:2379 | 9c18c4e81a122999 |   3.5.9 |  479 kB |     false |      false |         9 |       1648 |               1648 |        |
| http://10.10.10.4:2379 | b3e79132cbed1a84 |   3.5.9 |  475 kB |      true |      false |         9 |       1648 |               1648 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
Влияние на сервис не зафиксировано
<img width="768" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/4dfe246c-e73a-4795-bca3-860e06b5e09c">

получены алерты

SRE-COURSE-ALETRS, [12 дек. 2023 г., 21:07:19]:
Alerts Firing:
Labels:
 - alertname = EtcdInsufficientMembers
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=count%28etcd_server_id%29+%25+2+%3D%3D+0&g0.tab=1

Alerts Firing:
Labels:
 - alertname = ModuleDown
 - instance = 10.10.10.3:2379
 - job = etcd
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=up+%3D%3D+0&g0.tab=1

возвращаем ноду в работу
etcdctl endpoint status --cluster -w table --endpoints http://10.10.10.3:2379
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| http://10.10.10.5:2379 | 9c18c4e81a122999 |   3.5.9 |  479 kB |     false |      false |         9 |       1649 |               1649 |        |
| http://10.10.10.3:2379 | a9e63cb3360066aa |   3.5.9 |  475 kB |     false |      false |         9 |       1649 |               1649 |        |
| http://10.10.10.4:2379 | b3e79132cbed1a84 |   3.5.9 |  475 kB |      true |      false |         9 |       1649 |               1649 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+

!! Вывод двух из трех нод из кластера !!
Фиксируем текущее состояние. Останавливаем службу ETCD на мастере. Провереям выбран ли новый лидер и кто он. Останавливаем службу ETCD на новом мастере. Провереям работу кластера и приложения. Возвращаем остановленную ноду etcd в кластер. Фиксируем результат, проверяем алертинг системы мониторинга.
Останавливаем мастер-ноду
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| http://10.10.10.5:2379 | 9c18c4e81a122999 |   3.5.9 |  479 kB |      true |      false |        10 |       1650 |               1650 |        |
| http://10.10.10.3:2379 | a9e63cb3360066aa |   3.5.9 |  475 kB |     false |      false |        10 |       1650 |               1650 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
Alerts Firing:
Labels:
 - alertname = ModuleDown
 - instance = 10.10.10.4:2379
 - job = etcd
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=up+%3D%3D+0&g0.tab=1
Alerts Firing:
Labels:
 - alertname = EtcdInsufficientMembers
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=count%28etcd_server_id%29+%25+2+%3D%3D+0&g0.tab=1

Останавливаем новую мастер ноду
{"level":"warn","ts":"2023-12-12T18:28:37.920695Z","logger":"etcd-client","caller":"v3@v3.5.9/retry_interceptor.go:62","msg":"retrying of unary invoker failed","target":"etcd-endpoints://0xc0002c6c40/10.10.10.3:2379","attempt":0,"error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}
Error: failed to fetch endpoints from etcd cluster member list: context deadline exceeded
фиксируем развал кластера ETCD и наличие влияния на приложение - на GET запросы - ошибки
при этом на HAProxy Prometheus съедает всю память и SWAP - по причине не возможности записать такое кол-во сообщений об ошибках от генератора нагрузки
<img width="1348" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/3b5479c1-26be-4596-8265-ec31982ea0dc">
успешность приложения отсутствует
<img width="1348" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/deaa2670-ccbc-46de-9869-138d8f2beba3">
возвращаем ноды в работу - кластер ETCD успешно восстановлен
mmp@sre-etcd-01:~$ etcdctl endpoint status --cluster -w table --endpoints http://10.10.10.3:2379
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
|        ENDPOINT        |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+
| http://10.10.10.5:2379 | 9c18c4e81a122999 |   3.5.9 |  483 kB |     false |      false |        12 |       1662 |               1662 |        |
| http://10.10.10.3:2379 | a9e63cb3360066aa |   3.5.9 |  483 kB |      true |      false |        12 |       1662 |               1662 |        |
| http://10.10.10.4:2379 | b3e79132cbed1a84 |   3.5.9 |  487 kB |     false |      false |        12 |       1662 |               1662 |        |
+------------------------+------------------+---------+---------+-----------+------------+-----------+------------+--------------------+--------+

приложение восстановило свою работу в 21:41,(недостпуность приложения с 21:28) но из-за звгрузки HAProxy - сбоем Prometheus - данные до периода рестарта Prometheus получить не удалось - из внешнего Prometheus в Kubernetes, можно пронаблюдать за восстановлением работоспособности приложения
<img width="1362" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/ff0c7408-dd83-41a5-a9c8-3567b6b3b4c2">
недоступность приложения была зафиксирована в период развала ETCD кластера
<img width="1362" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/0712e62a-086b-459f-9a8e-1eb2e8137f72">
по Latency наблюдаю что ответы пользователи получали после восстановления ETCD кластера
<img width="1362" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/4c2074a1-7cb6-4796-9147-4312f78a0324">
Вывод: необходимо разобраться с влиянием на работу приложения при полном развале ETCD кластера
       перенести мониторинг на внешний сервер по отношению к HAProxy

В кластере патрони наблюдаем отсутствие выбора мастера
<img width="673" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/5e91c7f1-9903-4828-bd01-23b699e552e7">
что привело к недоступности БД
<img width="1350" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/7c388b5e-43d1-4ff2-a306-4e43e807da8f">
<img width="1427" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/0e1d69f8-8565-46d6-9e52-5dad660f7015">

причина
Отсутствие ETCD вызвает сбой работы Patroni который в свою очередь блокирует работу БД через HAProxy
ситуация ухудшилась при высокой нагрузки на HAProxy от работы Prometheus
способ решения
https://patroni.readthedocs.io/en/latest/dcs_failsafe_mode.html

!! Отключение нод патрони !!
Выключаем реплика ноду патрони - наблюдаем влияние
При отключении реплики патрони влияние не обнаружено

Выключаем мастер ноду патрони
При отключении мастер ноды, произошло переключение мастера и наблюдается влияние, всплеск 500 ошибки
При интесивном трафике - будет значительно
<img width="877" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/267fed5e-6c63-4ec8-98e8-fa0a12cb981c">


!! Высокая нагрузка на CPU !!
На Patroni мастер-сервер, создаем высокую нагрузку на CPU при помощи chaosblade
blade create cpu fullload
<img width="1341" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/e033b18d-e43e-4a53-85ca-2d7383c49b77">
<img width="675" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/fb204818-3397-429f-a1e2-9d3d3b1ca65d">

фиксурием увеличение время ответа на запросы к приложению
<img width="1348" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/20cdc5b3-955e-44bb-af1a-6095a1a11251">
<img width="1354" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/22f773ef-d3a1-428b-9950-b15c70d19702">
Снимаем нагрузку

Создаем нагрузку на память - так же Patroni-мастер
blade c mem load --mode ram --mem-percent 80
<img width="1154" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/8e301e4b-a995-4da8-9dc2-cc4c4058e4f7">
потребление памяти значительно, но деградация не наблдается
<img width="1348" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/ccc16c0f-fbd3-4a45-93fe-c3c0077ef4d0">

снимаем нагрузку
возникла проблема fatal error: runtime: cannot allocate memory
мастер машину перегружаем

!! сетевые проблемы !!
На хосте HAProxy создаем сетевую задержку в сторону мастер ноды Postgres
sudo ./blade create network delay --time 500 --interface ens160 --destination-ip 10.10.10.7
<img width="705" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/4521023e-4a65-467f-9970-4737dfeb800e">
фиксируем влияние на длительнотсь ответов
<img width="1353" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/bfc1c66e-0309-44df-8048-02e29a9c75da">
<img width="1353" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/207c7f91-d8f4-4091-aac7-6ba82e5722de">
отключаем эксперимент

Эмулируем потерю пакетов в направлении мастер Postgres 50%
sudo ./blade create network loss --percent 50 --interface ens160 --destination-ip 10.10.10.7
фиксируем потерю пакетов
<img width="618" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/a668b062-6a58-4e73-aeea-12bd79bc0aa6">

эксперимент оказал достаточно сильное влияние
зафикисрован ряд ошибок 499, 500
снижение доступности и возрастание времени ответа
<img width="1355" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/8321d4e7-051e-4aa6-a245-1177c1a28328">
<img width="1355" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/e7f19c06-3046-4b3d-846f-27cf385c1109">
<img width="1353" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/8e02fe55-f664-47ff-b8f6-d102e8525ad5">

рестарты подов в Кубере и возрастание нагрузки CPU на подах
<img width="689" alt="image" src="https://github.com/pmmson/sre-course/assets/43889620/d1bccc21-f78c-4d58-93ee-8d10f357a770">

фиксировались алерты на медленный ответ по пробам приложения
Alerts Firing:
Labels:
 - alertname = BlackboxSlowProbe
 - instance = /weatherforecast
 - job = blackbox probes
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=avg_over_time%28probe_duration_seconds%5B1m%5D%29+%3E+1&g0.tab=1

Alerts Firing:
Labels:
 - alertname = BlackboxSlowProbe
 - instance = /forecast/1
 - job = blackbox probes
Annotations:
Source: http://sre-ansbl-hprx:9090/graph?g0.expr=avg_over_time%28probe_duration_seconds%5B1m%5D%29+%3E+1&g0.tab=1













