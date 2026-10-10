import { useState } from 'react'

const WEATHER_GUIDES = [
  {
    id: 'storm',
    name: 'Mưa bão',
    icon: '🌧️',
    impact: [
      'Gây ngập lụt đường phố và khu dân cư.',
      'Có thể gây sạt lở đất, lũ quét ở vùng núi.',
      'Làm gián đoạn điện, nước và giao thông.',
      'Ảnh hưởng đến nhà cửa, nông nghiệp và sức khỏe.',
    ],
    precautions: [
      'Theo dõi dự báo thời tiết và thông báo của chính quyền địa phương.',
      'Chuẩn bị nước uống, thực phẩm, đèn pin và thuốc cần thiết.',
      'Gia cố nhà cửa; cất hoặc cố định vật dụng ngoài trời.',
      'Không ra ngoài khi thời tiết nguy hiểm; tránh xa cây lớn và biển hiệu.',
      'Di chuyển đến nơi an toàn khi có yêu cầu sơ tán.',
    ],
  },
  {
    id: 'heat',
    name: 'Nắng nóng',
    icon: '☀️',
    impact: [
      'Có thể gây mất nước, kiệt sức hoặc sốc nhiệt.',
      'Làm tăng nguy cơ cháy nổ và cháy rừng.',
      'Gây thiếu nước và ảnh hưởng hoạt động ngoài trời.',
    ],
    precautions: [
      'Uống nước thường xuyên và nghỉ ở nơi mát.',
      'Hạn chế hoạt động ngoài trời vào thời điểm nắng gắt.',
      'Mặc quần áo thoáng, đội mũ và dùng biện pháp chống nắng phù hợp.',
      'Không để trẻ em hoặc người cần chăm sóc trong xe đóng kín.',
      'Tìm hỗ trợ y tế nếu có dấu hiệu lú lẫn, ngất hoặc thân nhiệt bất thường.',
    ],
  },
  {
    id: 'flood',
    name: 'Lũ lụt',
    icon: '🌊',
    impact: [
      'Đe dọa tính mạng, nhà cửa và tài sản.',
      'Làm gián đoạn giao thông, điện và nước sạch.',
      'Nước ô nhiễm có thể làm tăng nguy cơ bệnh tật.',
    ],
    precautions: [
      'Di chuyển đến nơi cao và làm theo hướng dẫn sơ tán.',
      'Không đi bộ, bơi hoặc lái xe qua dòng nước ngập.',
      'Ngắt điện nếu an toàn để làm việc đó.',
      'Chuẩn bị nước uống, thực phẩm, thuốc và phương tiện liên lạc.',
      'Tránh tiếp xúc trực tiếp với nước lũ và dây điện bị đứt.',
    ],
  },
  {
    id: 'thunderstorm',
    name: 'Dông sét, gió giật',
    icon: '⛈️',
    impact: [
      'Sét có thể gây thương tích, tử vong hoặc cháy.',
      'Gió giật có thể làm đổ cây và vật dụng.',
      'Mưa lớn đi kèm có thể gây ngập cục bộ.',
    ],
    precautions: [
      'Vào nhà kiên cố hoặc ô tô mui cứng khi nghe tiếng sấm.',
      'Tránh trú dưới cây đơn độc, gần cột điện hoặc nơi trống trải.',
      'Tránh chạm vào thiết bị điện có dây và đường ống nước khi có sét.',
      'Đóng cửa, tránh xa cửa sổ và cất vật dụng ngoài trời.',
      'Chờ ít nhất 30 phút sau tiếng sấm cuối cùng mới ra ngoài.',
    ],
  },
  {
    id: 'drought',
    name: 'Hạn hán',
    icon: '🏜️',
    impact: [
      'Làm giảm nguồn nước sinh hoạt và sản xuất.',
      'Ảnh hưởng mùa màng, chăn nuôi và hệ sinh thái.',
      'Điều kiện khô hạn làm tăng nguy cơ cháy.',
    ],
    precautions: [
      'Sử dụng nước tiết kiệm và tuân theo khuyến cáo địa phương.',
      'Bảo quản nước sạch trong dụng cụ an toàn.',
      'Không đốt lửa hoặc đốt thực bì ở khu vực có nguy cơ cháy.',
      'Theo dõi hướng dẫn về chất lượng và hạn chế sử dụng nước.',
    ],
  },
  {
    id: 'fog',
    name: 'Sương mù',
    icon: '🌫️',
    impact: [
      'Làm giảm tầm nhìn khi tham gia giao thông.',
      'Tăng nguy cơ va chạm, đặc biệt trên đường cao tốc và đèo dốc.',
      'Có thể làm gián đoạn một số hoạt động giao thông.',
    ],
    precautions: [
      'Giảm tốc độ, bật đèn phù hợp và giữ khoảng cách an toàn.',
      'Không dùng đèn pha gây lóa và không vượt khi tầm nhìn hạn chế.',
      'Nếu tầm nhìn quá kém, dừng xe ở nơi an toàn ngoài phần đường chạy.',
      'Kiểm tra thông tin giao thông trước khi tiếp tục hành trình.',
    ],
  },
]

function WeatherSafetyGuide({ onBack }) {
  const [expandedGuideId, setExpandedGuideId] = useState(WEATHER_GUIDES[0].id)

  const toggleGuide = (guideId) => {
    setExpandedGuideId((currentId) => currentId === guideId ? null : guideId)
  }

  return (
    <section className="weather-safety-guide" aria-labelledby="safety-guide-title">
      <button className="guide-back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        Quay lại thông tin chi tiết
      </button>

      <header className="safety-guide-heading">
        <p className="eyebrow">CẨM NANG AN TOÀN</p>
        <h2 id="safety-guide-title">Các loại thời tiết &amp; cách phòng tránh</h2>
        <p>Chọn một hiện tượng để xem ảnh hưởng thường gặp và cách giữ an toàn.</p>
      </header>

      <div className="safety-guide-list">
        {WEATHER_GUIDES.map((guide, index) => {
          const isExpanded = expandedGuideId === guide.id

          return (
            <article className={`safety-guide-card ${isExpanded ? 'expanded' : ''}`} key={guide.id}>
              <button
                className="safety-guide-trigger"
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`guide-content-${guide.id}`}
                onClick={() => toggleGuide(guide.id)}
              >
                <span className="guide-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="guide-icon" aria-hidden="true">{guide.icon}</span>
                <span className="guide-title">{guide.name}</span>
                <span className="guide-trigger-hint">{isExpanded ? 'Thu gọn' : 'Xem hướng dẫn'}</span>
                <span className="guide-chevron" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded && (
                <div className="safety-guide-content" id={`guide-content-${guide.id}`}>
                  <section className="guide-impact">
                    <h3>Ảnh hưởng có thể gặp</h3>
                    <ul>
                      {guide.impact.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                  <section className="guide-precautions">
                    <h3>Cách phòng tránh</h3>
                    <ul>
                      {guide.precautions.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <aside className="safety-guide-note">
        <span aria-hidden="true">ⓘ</span>
        <p><strong>Lưu ý:</strong> Luôn theo dõi dự báo và làm theo hướng dẫn của cơ quan chức năng tại địa phương.</p>
      </aside>
    </section>
  )
}

export default WeatherSafetyGuide
