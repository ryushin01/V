# 실제 모델 카탈로그

실제 제품은 `src/entities/plan/model/catalog-models.ts`에 있습니다. 값은 2026-11-10에 공개 자료로 확인했습니다. Antec Torque는 출처마다 축 표기가 달라, 두 출처가 맞는 깊이 621mm를 세로로 썼습니다. 제조사 공식 사양을 바로 찾지 못한 경우가 많아, 판매처와 사양 정리 사이트의 값이 서로 맞는지 확인해 넣었습니다. 출처마다 값이 달라 확인할 수 없는 제품(Secretlab TITAN Evo 의자 크기, KEF LSX II 전력, PS5 슬림 정격 전력 등)은 넣지 않거나 기준을 밝혔습니다.

배치 전에 실제 제품을 확인하고, 다르면 편집 화면의 규격 입력으로 고쳐 주세요.

## 측정 기준

- 가로×세로는 위에서 본 바닥 면적(cm)입니다. 화면은 스탠드를 포함하고, 게임기는 눕혀 놓은 상태입니다. Xbox Series X만 세운 상태입니다.
- 소비 전력은 제품마다 공개된 기준이 달라 함께 저장하고 편집 화면에 표시합니다.

| 기준          | 뜻                                                          |
| ------------- | ----------------------------------------------------------- |
| 최대          | 제조사·판매처가 표기한 최대 소비 전력                       |
| 정격          | 설명서·라벨의 정격 소비 전력                                |
| 일반 사용     | 판매처가 표기한 일반 사용 소비 전력. 최대보다 낮습니다      |
| 판매처 표기   | 최대인지 일반인지 밝히지 않은 값                            |
| 전원부·어댑터 | 내장 전원부 또는 어댑터의 정격. 실제 사용 전력보다 높습니다 |
| 실측          | 제조사 표기가 없어 리뷰 실측값을 쓴 경우                    |
| 추정·기본값   | PC 케이스처럼 구성에 따라 다르거나 표기가 없는 경우         |

## 모델

| 모델                                   | 가로×세로(cm)          | 전력(W)  | 기준        |
| -------------------------------------- | ---------------------- | -------- | ----------- |
| Samsung Odyssey OLED G9 49인치 (G95SC) | 119.5×23.7             | 220      | 최대        |
| LG UltraGear OLED 45인치 (45GR95QE)    | 99.3×36.3              | 160      | 최대        |
| Dell Alienware AW3423DWF               | 81.5×30.6              | 200      | 최대        |
| LG UltraGear OLED 27인치 (27GS95QE)    | 60.4×25.8              | 72       | 최대        |
| LG OLED evo C4 65인치                  | 144.0×23.1             | 145      | 일반 사용   |
| LG OLED evo C4 55인치                  | 122.2×23.0             | 114      | 일반 사용   |
| Samsung OLED S90D 65인치               | 144.5×26.4             | 375      | 최대        |
| Sony BRAVIA 8 II 65인치                | 144.3×33.9             | 397      | 판매처 표기 |
| PlayStation 5 Pro                      | 38.8×21.6              | 390      | 정격        |
| PlayStation 5 (슬림)                   | 35.8×21.6              | 216      | 실측        |
| Xbox Series X (세워 둠)                | 15.1×15.1              | 315      | 전원부      |
| Xbox Series S                          | 27.5×15.1              | 165      | 전원부      |
| Nintendo Switch 2 독                   | 20.1×5.1               | 60       | 어댑터      |
| Mac mini (M4)                          | 12.7×12.7              | 155      | 최대        |
| Mac Studio (2025)                      | 19.7×19.7              | 480      | 최대        |
| Lian Li O11 Dynamic EVO 케이스         | 28.5×46.5              | 550      | 추정        |
| NZXT H9 Flow 케이스                    | 29.0×49.5              | 550      | 추정        |
| Fractal Design North 케이스            | 21.5×46.9              | 550      | 추정        |
| IKEA UPPSPEL 게이밍 책상 180           | 180×80                 | -        | -           |
| Secretlab MAGNUS Pro / Pro XL          | 150×70 / 177×80        | -        | -           |
| IKEA BESTÅ TV장 180                    | 180×42                 | -        | -           |
| Herman Miller Aeron (B 사이즈)         | 68.6×69.8              | -        | -           |
| Sonos Arc Ultra / Sub 4                | 117.8×11.1 / 40.2×15.8 | 40 / 120 | 기본값      |
| Samsung HW-Q990D 사운드바 / 서브우퍼   | 123.2×13.8 / 22.0×41.0 | 41 / 26  | 일반 사용   |
| Denon AVR-X1800H                       | 43.4×33.9              | 430      | 정격        |
| MacBook Air 13인치 (M4)                | 30.4×21.5              | 30       | 어댑터      |
| MacBook Air 15인치 (M4)                | 34.0×23.8              | 35       | 어댑터      |
| MacBook Pro 14인치                     | 31.3×22.1              | 70       | 어댑터      |
| MacBook Pro 16인치                     | 35.6×24.8              | 140      | 어댑터      |
| iMac 24인치 (M4)                       | 54.7×14.7              | 143      | 어댑터      |
| Apple Studio Display 27인치            | 62.3×16.8              | 21       | 일반 사용   |
| Antec Torque 오픈 프레임 케이스        | 28.5×62.1              | 550      | 추정        |

## 일러스트

실제 모델은 `src/entities/plan/ui/model-glyphs.ts`에서 위에서 본 모습을 따로 그립니다. 곡면 화면의 곡률(G9 1000R, 45인치 800R, AW3423DWF 1800R), 스탠드와 받침 모양, 통풍구, 패널 분할처럼 위에서 알아볼 수 있는 특징을 선으로 옮겼고, 제조사 로고는 그리지 않습니다. 사용자가 치수를 바꿔도 비율대로 늘어납니다.

새 모델을 추가할 때는 사양 확인과 출처 기록, 모델별 일러스트를 함께 만듭니다.

## 출처

- Samsung G95SC: [Multitronic](https://multitronic.fi/en/products/4584341/samsung-odyssey-oled-g9-g95sc-49--dual-qhd--oled--240hz-curved-gamingskarm), [Stock in the Channel](https://sandbox.stockinthechannel.com/Product/Samsung-G95SC-computer-monitor-124-5-cm-49-5120-x-1440-pixels-Dual-QHD-OLED-Silver/12598574)
- LG 45GR95QE: [Computer Alliance](https://www.computeralliance.com.au/45-lg-ultragear-45gr95qe-b-oled-qhd-240hz-curved-gaming-monitor), [DisplayDB](https://www.displaydb.com/monitor/lg-45gr95qe)
- Dell AW3423DWF: [DisplaySpecifications](https://www.displayspecifications.com/en/model/1c722e8e), [Icecat](https://icecat.fr/amp/p/vendorName/mpn/desc-108293637.html)
- LG 27GS95QE: [LG 사양서(PC Richard)](https://static.pcrichard.com/docs/27GS95QE-B_Specifications-Sheet_01.pdf), [DisplaySpecifications](https://www.displayspecifications.com/en/model/ed1a3732)
- LG C4: [DisplaySpecifications 65](https://www.displayspecifications.com/en/model/1b82389c), [DisplaySpecifications 55](https://www.displayspecifications.com/en/model/70bb389d), [Costco 지원](https://productsupport.costco.com/customer/device/LG/2024OLED65C4AUAOLEDevoC4Series)
- Samsung S90D: [HDTV Magazine](https://www.hdtvmagazine.com/equipment/tvs/samsung/qn65s90dafxza/), [D&S Appliances](https://dshomeappliances.com/products/samsung-qn65s90dafxza)
- Sony BRAVIA 8 II: [Sony Asia 사양](https://www.sony-asia.com/bravia/products/bravia-8m2/spec), [Fullspecs](https://fullspecs.net/smart-tv/sony/k-65xr80m2-specifications/)
- PS5 Pro: [Video Games Chronicle](https://www.videogameschronicle.com/news/the-official-playstation-5-pro-specifications-have-been-revealed), [Instant Gaming](https://news.instant-gaming.com/en/articles/9112-here-are-the-official-technical-specs-of-the-ps5-pro)
- PS5 슬림: [Gematsu](https://gematsu.com/2023/10/ps5-slim-models-launch-in-november), [NoobFeed 실측](https://www.noobfeed.com/articles/ps5-slim-2100-review-design-less-storage)
- Xbox Series X·S: [Wikipedia](https://en.wikipedia.org/wiki/Xbox_Series_X_and_Series_S), [iFixit 분해](https://documents.cdn.ifixit.com/pdf/ifixit/guide_138451_en.pdf), [ChargerLAB 165W 전원부](https://www.chargerlab.com/teardown-of-165w-power-supply-for-microsoft-xbox-series-s/)
- Nintendo Switch 2 독: [Nintendo 기술 사양](https://nintendo.com/en-ca/gaming-systems/switch-2/tech-specs), [Nintendo Life](https://www.nintendolife.com/guides/nintendo-switch-2-dock-size-hdmi-connections-guide-4k-upscale-rumours)
- Mac mini·Mac Studio: [YugaTech Mac mini](https://www.yugatech.com/spec/mac-mini-m4/), [YugaTech Mac Studio](https://www.yugatech.com/spec/apple-mac-studio-2025/)
- PC 케이스: [Lian Li O11 EVO 리뷰(TechPowerUp)](https://techpowerup.com/review/lian-li-o11-dynamic-evo), [비교(Galaxus)](https://www.galaxus.fr/en/s1/producttype/pc-case-77/compare/nzxt-h9-flow-vs-lian-li-o11d-evo-rgb-5855), [Fractal North 비교](https://frontdeskreview.com/gear/pc-cases/lian-li-o11-dynamic-evo-vs-fractal-design-north/)
- IKEA UPPSPEL: [IKEA](https://www.ikea.com/gb/en/p/uppspel-styrspel-gaming-desk-and-chair-black-grey-red-s19492700)
- Secretlab MAGNUS Pro: [Secretlab](https://secretlab.co/pages/magnus-pro)
- IKEA BESTÅ: [IKEA](https://www.ikea.com/gb/en/p/besta-tv-bench-with-drawers-and-door-white-lappviken-dark-grey-s69572978)
- Herman Miller Aeron: [Herman Miller 제품 모델](https://www.hermanmiller.com/en_gb/resources/3d-models-and-planning-tools/product-models/individual/aeron-chair-b-size-fully-adjustable-arms/), [Herman Miller Store](https://store.hermanmiller.com/office-chairs-aeron?lang=en_US)
- Sonos Arc Ultra·Sub 4: [B&H](https://www.bhphotovideo.com/c/product/1865279-REG/sonos_arc_ultra_soundbar.html/specs), [Sonos Sub 4](https://www.sonos.com/en-au/shop/sub-4)
- Samsung HW-Q990D: [Coolblue](https://www.coolblue.nl/en/product/946981/samsung-hw-q990d-2024.html), [사양서(Secomp)](https://www.secomp.ch/media/pdf/s05/05050263_en_data_2024.pdf)
- Denon AVR-X1800H: [Denon](https://www.denon.com/en/product/av-receivers/avr-x1800h/AVRX1800H.html)
- MacBook Air M4: [Multitronic 13인치](https://www.multitronic.fi/en/products/4466736), [Appalachian State 15인치](https://campusstore.appstate.edu/15-MA), [iDownloadBlog 15인치 사양](https://www.idownloadblog.com/?p=1030029)
- MacBook Pro 14·16인치: [Apple 사양](https://apple.com/uk/macbook-pro/specs), [iDownloadBlog 16인치](https://www.idownloadblog.com/?p=1017598)
- iMac 24인치: [Apple 사양](https://hn.jakechampion.name/reader/https://www.apple.com/imac-24/specs), [Multitronic](https://multitronic.fi/en/products/4408291)
- Apple Studio Display: [Apple 사양](https://apple.com/kg/studio-display/specs)
- Antec Torque: [TechPowerUp](https://www.techpowerup.com/248923/antec-presents-futuristic-angular-frame-open-air-chassis), [bit-tech](https://bit-tech.net/reviews/tech/cases/antec-torque-review/1/)
