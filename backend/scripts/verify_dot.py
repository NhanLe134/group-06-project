import json
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')
BASE = 'http://localhost:8000'

menu = json.load(urllib.request.urlopen(BASE + '/menu'))
print(f"1) Menu: {len(menu)} món (thucdon giữ nguyên)")
avail = [m for m in menu if m['status'] == 'available']
pid, tra = avail[0]['id'], avail[1]['id']
print(f"   Dùng 2 món còn bán: {avail[0]['name']} + {avail[1]['name']}")


def post_round(items):
    body = json.dumps({'table_name': 'Bàn 01', 'items': items}, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        BASE + '/orders', data=body, headers={'Content-Type': 'application/json'}
    )
    return json.load(urllib.request.urlopen(req))


o1 = post_round([
    {'thucdon_id': pid, 'soluong': 1, 'ghichu': 'Ít cay'},
    {'thucdon_id': tra, 'soluong': 2},
])
print(f"2) Gửi đợt 1: {len(o1['items'])} món | tongtien: {o1['tongtien']}")

time.sleep(1.2)
o2 = post_round([{'thucdon_id': pid, 'soluong': 1}])
print(f"3) Gửi đợt 2: tổng dòng hóa đơn tạm tính: {len(o2['items'])}")
for i in o2['items']:
    print(f"   - {i['tenmon']} → đợt {i['dot']}")

cur = json.load(urllib.request.urlopen(
    BASE + '/orders/current?table_name=' + urllib.parse.quote('Bàn 01')
))
print(f"4) Hóa đơn tạm tính Bàn 01: tổng {cur['tongtien']}₫ | all_served: {cur['all_served']}")

tables = json.load(urllib.request.urlopen(BASE + '/cashier/tables'))
t01 = next(t for t in tables if t['tenban'] == 'Bàn 01')
print(
    f"5) Cashier — Bàn 01: trangthai {t01['trangthai']} (2=đang phục vụ)"
    f" | tổng {t01['tongtien']}₫ | {t01['so_phieuban']} phiếu"
)

qr = json.load(urllib.request.urlopen(urllib.request.Request(
    BASE + f"/tables/{t01['id']}/pay-qr", method='POST'
)))
print(f"6) QR thanh toán: {qr['amount']}₫ | {qr['so_phieuban']} phiếu | QR ok: {qr['qr_url'].startswith('https://')}")

closed = json.load(urllib.request.urlopen(urllib.request.Request(
    BASE + f"/tables/{t01['id']}/close", method='POST'
)))
print(f"7) Thanh toán & đóng bàn: {closed['message']}")
print(f"   hoadon sinh: {closed['hoadon_id']} | tổng: {closed['tongtien']}₫")

tables2 = json.load(urllib.request.urlopen(BASE + '/cashier/tables'))
t01b = next(t for t in tables2 if t['tenban'] == 'Bàn 01')
print(
    f"8) Sau đóng bàn — Bàn 01: trangthai {t01b['trangthai']} (3=chờ dọn)"
    f" | tổng phiếu mở: {t01b['so_phieuban']}"
)
