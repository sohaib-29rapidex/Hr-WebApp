"""Quick test: python3 check_machine.py <ip> [port] [comm_key] [udp]"""
import sys
from zk import ZK
ip = sys.argv[1]; port = int(sys.argv[2]) if len(sys.argv) > 2 else 4370
key = int(sys.argv[3]) if len(sys.argv) > 3 else 0; udp = len(sys.argv) > 4
c = ZK(ip, port=port, timeout=15, password=key, force_udp=udp, ommit_ping=True).connect()
print("Device:", c.get_device_name(), "Serial:", c.get_serialnumber())
u, a = c.get_users(), c.get_attendance()
print("Users:", len(u), "Logs:", len(a))
for x in a[-10:]:
    print(" ", x.user_id, x.timestamp)
c.disconnect()
