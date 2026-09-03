# Ghi chép Phỏng vấn & Khảo sát Người dùng (Interview Notes - Detailed BA Script)
> Dữ liệu thô ban đầu phục vụ bóc tách yêu cầu và phân tích Persona/JTBD. Mọi tài liệu PRD, Flow và User Stories sau này đều phải bắt nguồn từ dữ liệu trong file này. Transcript đã được ghi chép đầy đủ từ các buổi phỏng vấn sâu (Deep Interview) kéo dài 45-60 phút mỗi buổi.

---

## 🎤 CUỘC PHỎNG VẤN 1: KHÁCH HÀNG (CUSTOMER)
**Thời lượng phỏng vấn:** 50 phút
**Profile:** Anh Tuấn (28 tuổi, Nhân viên văn phòng, thường đi ăn nhóm 4-6 người vào dịp cuối tuần, ngân sách trung bình 300k-500k/người).

**BA:** Chào anh Tuấn. Cảm ơn anh đã dành thời gian. Khi anh dẫn gia đình đi ăn nhà hàng vào dịp cuối tuần đông đúc, anh có thể mô tả trải nghiệm từ lúc bước vào quán đến lúc ngồi xuống bàn không?

**Tuấn:** 
Thật sự mà nói thì cuối tuần nào đi ăn cũng như đi đánh trận. Vào quán là thấy đông nghẹt. Mình xin một bàn 6 người, phục vụ bảo chờ 10 phút để dọn bàn, nhưng mình đứng chờ rã cả chân cũng không biết bàn nào đang dọn. Lên đến bàn thì trên bàn vẫn còn ly nước của khách trước chưa dọn hết.

**BA:** Sau khi ngồi vào bàn, anh thường gặp trở ngại gì nhất trong khâu chọn món?

**Tuấn:** 
Cái phiền nhất là khâu gọi món. Menu giấy thì quyển dày cộp, qua tay nhiều người mỡ màng dính dấp. Nhiều lúc hình ảnh trên menu nhìn rất ngon nhưng không ghi rõ nguyên liệu. 

Nhóm mình hay có người kén ăn hoặc dị ứng. Ví dụ vợ mình không ăn được đậu phộng, thằng bé con thì không ăn cay. Mỗi lần nhìn menu hàng chục món không biết chọn cái nào, gọi phục vụ tới hỏi thì các bạn ấy là sinh viên part-time, lúng túng không thuộc thành phần món ăn, lại phải chạy đi hỏi bếp.

**BA:** Nếu hệ thống nhà hàng có một ứng dụng hoặc QR code tại bàn, anh mong muốn nó giải quyết bài toán này như thế nào?

**Tuấn:** 
Mình rất muốn có một **Trợ lý ảo (AI Assistant)** trên điện thoại khi quét mã QR. 

Mình không muốn phải lướt lướt tự tìm kiếm nữa. Mình chỉ cần gõ (hoặc bấm nút nói âm thanh): *"Tư vấn cho bàn mình 4 món, trong đó có 2 món không cay cho trẻ em và tuyệt đối không có đậu phộng, ngân sách tầm 1 triệu rưỡi"*. 

Hệ thống AI phải tự động lọc menu và trả lời lại bằng ngôn ngữ tự nhiên, gợi ý đúng 4 món đó kèm hình ảnh hấp dẫn.

**BA:** Ý tưởng rất hay! Sau khi AI tư vấn xong, anh muốn quá trình gọi món (đẩy order) diễn ra thế nào để tránh sai sót?

**Tuấn:** 
Khi AI gợi ý xong, mình chọn món thì AI tự động **chuyển đoạn chat đó thành Giỏ hàng (Order Draft)**. 

Nhưng lưu ý điểm này: AI KHÔNG ĐƯỢC tự động chốt đơn và đẩy thẳng xuống bếp. Nhóm mình có thể đổi ý. Hệ thống bắt buộc phải hiển thị một bản tóm tắt (Order Draft) trên màn hình để mình dò lại: đúng 4 món chưa, đúng ghi chú "không cay" chưa, tổng tiền bao nhiêu. 

Sau khi cả bàn đồng ý, mình bấm nút **"Xác nhận đặt món" (Explicit Confirmation)** thì đơn mới chính thức được báo "Thành công" và đẩy xuống bếp.

**BA:** Trong lúc ăn, nếu anh muốn gọi thêm món thì sao?

**Tuấn:** 
Thì mình lại vào cái app QR đó, bấm gọi thêm ly bia hoặc dĩa khoai tây chiên. Và đặc biệt, mình muốn thấy cái **Trạng thái món ăn (Order Status)**. Ví dụ: Đang nấu, Đã xong, Đang mang ra. Chứ không phải cứ ngồi ngóng cổ lên chờ, vẫy phục vụ thì họ toàn hứa "dạ món của anh ra liền" mà 15 phút sau chưa thấy.

**BA:** Về khâu thanh toán (Pay & Close), nhóm anh thường xử lý thế nào?

**Tuấn:** 
Ăn xong mình muốn xem Bill ngay trên app. 

Nhiều lúc đi ăn bạn bè, việc chia tiền (Split bill) rất nhạy cảm và phức tạp. Đứa về trước, đứa về sau, đứa ăn ít đứa ăn nhiều. Nếu app có nút "Chia đều" hoặc chọn "Tôi trả cho 3 món này", rồi hiện ra mã QR MoMo/VNPAY cá nhân để mình quét chuyển khoản luôn tại bàn thì quá tuyệt. Khỏi cần ra quầy xếp hàng đợi thu ngân, khỏi thối tiền lẻ rườm rà.

---

## 🎤 CUỘC PHỎNG VẤN 2: PHỤC VỤ BÀN (WAITER)
**Thời lượng phỏng vấn:** 45 phút
**Profile:** Chị Lan (22 tuổi, Sinh viên làm thêm, làm ca tối giờ cao điểm từ 18h-22h).

**BA:** Chào Lan. Bạn làm ca tối thường là giờ cao điểm nhất. Công việc phục vụ của bạn gặp rủi ro ở những công đoạn nào từ lúc khách gọi món (Order) đến lúc bưng món (Serve)?

**Lan:** 
Chào anh. Khổ nhất là việc ghi tay order. Khách thì đông, nhạc thì ồn. Khách đọc một tràng "cho chị ly nước ép ít đường không đá, thêm 1 dĩa salad không hành, 1 bò bít tết chín kỹ". Chữ em viết ngoáy trên tờ giấy note nhỏ xíu. 

Em phải lội bộ từ lầu 2 xuống tầng trệt, lách qua đám đông để ghim tờ giấy đó vào nhà bếp. Nhiều khi xuống tới nơi mồ hôi nhễ nhại, bếp nhìn tờ giấy đọc nhầm chữ "không hành" thành "nhiều hành", làm sai món. Bưng lên khách chửi, em phải xin lỗi và bưng xuống bắt bếp làm lại, rất ức chế.

**BA:** Bạn cần công cụ gì để làm việc nhàn hơn và không bị sai sót?

**Lan:** 
Nếu khách dùng điện thoại quét mã QR tự chat với AI để gọi món thì em rất nhàn, em chỉ lo việc bưng bê thôi. 

Nhưng với khách lớn tuổi không rành công nghệ, họ vẫn vẫy em lại gọi món. Lúc này em muốn nhà hàng cấp cho em 1 cái máy tính bảng (Tablet). Em có thể **nói trực tiếp vào Tablet (Voice-to-order)** thay vì đứng bấm bấm mỏi tay. App tự nhận diện câu nói của khách, chuyển thành order, em đưa khách xem lại cái màn hình nháp, khách gật đầu thì em bấm "Gửi". Đơn tự bay xuống bếp.

**BA:** Về việc theo dõi trạng thái bàn và bưng bê món, hiện tại bạn kiểm soát thế nào?

**Lan:** 
Bằng trí nhớ và chạy bộ thôi anh. Em ở lầu 2, bếp ở trệt. Em không biết khi nào món của lầu 2 nấu xong. Cứ 10 phút em lại phải chạy xuống bếp nghía thử xem có đồ chưa.

App của em cần phải "Ting ting" thông báo ngay: *"Bàn số 5 có món bò bít tết xong rồi, xuống bưng đi"*. Em đi bưng (Serve) ngay cho khách lúc còn bốc khói.

Và trên Tablet của em phải có sơ đồ trạng thái bàn (Table Map). Bàn nào màu Xanh là Trống, màu Đỏ là Đang ăn, màu Vàng là Đang chờ tính tiền, màu Xám là Khách vừa đi cần dọn dẹp. Lúc nãy anh Tuấn nói khách chờ dọn bàn lâu là vì tụi em ở dưới trệt không biết khách trên lầu đã đứng dậy để lên dọn đấy ạ.

---

## 🎤 CUỘC PHỎNG VẤN 3: ĐẦU BẾP (KITCHEN)
**Thời lượng phỏng vấn:** 55 phút
**Profile:** Chú Hùng (45 tuổi, Bếp trưởng, kinh nghiệm làm nghề 15 năm).

**BA:** Chú Hùng ơi, cách nhận order bằng giấy viết tay (Kitchen Ticket) hiện tại làm chú mệt mỏi ở điểm nào nhất?

**Chú Hùng:** 
Rối loạn lắm cháu ơi. Mấy chục tờ giấy ghim chồng chéo lên cái bảng nhôm. Môi trường bếp thì nóng nực, dầu mỡ, nhiều khi giấy rớt xuống vũng nước là nhòe hết chữ.

Chú không biết đơn nào vào trước, đơn nào vào sau. Đặc biệt mấy cái ghi chú "ít đường, không cay, dị ứng hải sản" mà phục vụ ghi bằng chữ bác sĩ thì chú hay làm sai, khách trả lại món là nhà hàng lỗ vốn. Đôi khi có bàn V.I.P cần ưu tiên lên món trước, phục vụ chạy xuống dặn miệng, quay qua quay lại chú quên béng mất.

**BA:** Chú có mong muốn một hệ thống hiển thị trong bếp (KDS - Kitchen Display System) hoạt động thế nào để giải quyết việc này?

**Chú Hùng:** 
Chú muốn bỏ ngay cái bảng giấy. Thay vào đó là một cái màn hình cảm ứng to đùng treo tường. 

Order đẩy vào tự sắp xếp theo thời gian (cái nào gọi trước thì nằm ở đầu). Màn hình phải tô đậm mấy cái ghi chú dị ứng bằng chữ to màu vàng để chú không bị nhầm. 

Bàn nào đợi quá 15 phút thì cái phiếu trên màn hình sẽ tự nhấp nháy màu Đỏ để chú biết hối anh em phụ bếp làm nhanh. Món nào làm xong, chú chạm ngón tay vào màn hình chọn "Xong (Done)", lập tức hệ thống tự báo lên điện thoại của tụi phục vụ xuống bưng (Serve), chú khỏi phải hét khản cả cổ.

**BA:** Khâu quản lý Tồn kho nguyên liệu (Inventory) hàng ngày diễn ra sao thưa chú? Chú xử lý thế nào khi hết nguyên liệu giữa chừng?

**Chú Hùng:** 
Rất thủ công và chắp vá. Ví dụ 8h tối cuối tuần là bán sạch thịt bò. Chú phải hét to lên báo sảnh ngoài "hết bò". Mà sảnh ồn quá, phục vụ không nghe, khách ngoài kia vẫn cứ quét mã QR để order thịt bò, lát sau không có làm, khách chửi nhà hàng treo đầu dê bán thịt chó.

Chú cần một cái nút **"Hết hàng" (Out of Stock)** ngay trên màn hình KDS. Chú chạm vào hình miếng thịt bò, bấm nút "Hết hàng", thì LẬP TỨC hệ thống phải đồng bộ khóa cái món bò đó ở ngoài menu QR của khách, và khóa luôn trên Tablet của phục vụ. Con AI tư vấn ngoài sảnh cũng phải biết để báo khách là "Dạ bò mới hết, nhà hàng gợi ý món heo rừng nướng thay thế nhé".

---

## 🎤 CUỘC PHỎNG VẤN 4: QUẢN LÝ / THU NGÂN (MANAGER / CASHIER)
**Thời lượng phỏng vấn:** 60 phút
**Profile:** Chị Mai (35 tuổi, Quản lý kiêm Thu ngân nhà hàng).

**BA:** Chị Mai đánh giá thế nào về quy trình tính tiền, kiểm soát doanh thu (Pay -> Close) và quản lý nhân sự hiện tại?

**Chị Mai:** 
Làm quản lý kiêm thu ngân khổ nhất là lúc 9-10h tối khi khách ùa ra về cùng lúc. Chị phải căng mắt dò từng tờ hóa đơn giấy xem bàn đó đã ăn những gì, có hủy món nào không (void item), có gọi thêm bia nhưng phục vụ quên ghi vào giấy không. Bấm máy tính chậm thì khách nhăn nhó bảo "làm ăn lề mề".

Cuối ngày, chị ôm một đống hóa đơn để đối soát, lệch 50 ngàn là phải ngồi cả tiếng đồng hồ tìm lỗi, không tìm ra thì nhân viên chia nhau đền tiền.

**BA:** Nếu hệ thống số hóa hoàn toàn, chị xếp hạng các tính năng nào là "Sống còn" bắt buộc phải có?

**Chị Mai:** 
**Thứ nhất: Tự động cộng tiền chuẩn 100% & Tích hợp QR thanh toán.** 
Hệ thống phải tự lấy dữ liệu từ order của khách và bếp. Khi khách thanh toán QR thành công, hệ thống tự động đổi màu bàn thành "Cần dọn dẹp" trên app của phục vụ để các em ấy lên dọn ngay. Bàn sạch sẽ thì chị mới đón lượt khách mới được.

**Thứ hai: Quản lý Menu (CMS) đồng bộ thời gian thực.** 
Chị phải có quyền thêm món mới, cập nhật giá món (ví dụ dịp Tết tăng giá), đổi hình ảnh món ăn dễ dàng trên máy tính mà không cần gọi IT. Quan trọng nhất: Menu này phải đồng bộ TRỰC TIẾP với con AI tư vấn ngoài sảnh. Chị thêm món mới thì 1 phút sau con AI phải biết đường đem món đó đi giới thiệu cho khách.

**Thứ ba: Phân quyền bảo mật chặt chẽ (RBAC).** 
Đây là lỗ hổng lớn nhất hiện tại. Nhân viên phục vụ nhiều lúc nhận tiền mặt của khách xong, tự ý gạch bỏ món trên giấy để gian lận đút tiền túi. Hệ thống mới bắt buộc phải khóa quyền này. Chỉ có tài khoản Quản lý của chị mới có quyền Hủy món (Void) hoặc Hoàn tiền (Refund) khi món đã đẩy xuống bếp. Mọi thao tác hủy món đều phải ghi log (nhật ký) để cuối tháng chị kiểm tra.

**Thứ tư: Đối soát tồn kho (Inventory Reconciliation).** 
Khi nhà hàng bán 1 đĩa bò, hệ thống phải tự động trừ kho 200 gram thịt bò. Nhưng thực tế nấu nướng luôn có hao hụt (rơi vãi, hỏng). Nên cuối ngày, chị cần một màn hình để nhập số lượng kiểm kê thực tế đếm được dưới kho tivi tủ lạnh. Hệ thống phải so sánh con số Thực Tế với con số Hệ Thống, và xuất báo cáo xem bị chênh lệch thất thoát bao nhiêu phần trăm.

**Thứ năm: Dashboard Báo cáo Real-time.** 
Chị không thể chờ đến cuối tháng mới xem báo cáo doanh thu được. Chị cần mở điện thoại lên là thấy ngay: Hôm nay bán được bao nhiêu tiền? Món nào lọt Top 1 Bestseller? Tỷ lệ lấp đầy bàn (Occupancy rate) là bao nhiêu? Để từ đó chị ra quyết định ngày mai đi chợ mua thêm nguyên liệu gì.