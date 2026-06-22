<p align="center">
  <img src="app_icon.png" width="128" alt="SereneMix Logo" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);" />
</p>

<h1 align="center">SereneMix</h1>

<p align="center">
  <strong>Premium Ambient Sound Mixer for Windows Desktop</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-v31.0.0-blue.svg" alt="Electron"></a>
  <img src="https://img.shields.io/badge/Platform-Windows-lightgrey.svg" alt="Platform">
</p>

<br>

**SereneMix**, Microsoft Store'da yer alan Ambie uygulamasından esinlenerek geliştirilmiş, Windows için modern bir ortam sesi mikseridir. Birden fazla rahatlatıcı sesi aynı anda oynatmanıza, ses seviyelerini bağımsız olarak ayarlamanıza, özel miksler kaydetmenize, uyku zamanlayıcısı belirlemenize ve ses kapakları ile başlıklarını özelleştirmenize olanak tanır.

Gerçek zamanlı dizin izleyicisi (Directory Watcher) sayesinde, yeni ses dosyalarınızı (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`) uygulamayı yeniden başlatmaya gerek kalmadan doğrudan yerel ses klasörünüze sürükleyip bırakarak anında dinleyebilirsiniz.

---

## Öne Çıkan Özellikler 🚀

- **Eşzamanlı Ses Oynatma**: Mükemmel ambiyansınızı yaratmak için birden fazla doğa veya beyaz gürültü sesini aynı anda dinleyin.
- **Sistem Tepsisi (Tray) Entegrasyonu**: SereneMix arka planda çalışmaya ve sesleri oynatmaya devam etmek için sistem tepsisine küçülür. Tepsi simgesine sağ tıklayarak tüm sesleri oynatabilir, durdurabilir veya uygulamadan çıkabilirsiniz.
- **Dinamik Çoklu Dil Desteği (EN/TR)**: İngilizce ve Türkçe dilleri arasında anında geçiş yapın. Arayüz, ayarlar, ses adları/kategorileri ve sistem tepsisi menüsü seçilen dille anlık olarak senkronize olur.
- **Premium Glassmorphism Arayüzü**: Tamamen çerçevesiz pencere yapısı, tam ekran/pencere boyutu için çift tıklama destekli özel başlık çubuğu, akıcı animasyonlar, dinamik CSS gradyanları ve ekolayzır dalga görselleştirmeleri.
- **Gerçek Zamanlı Klasör Senkronizasyonu**: Ses dosyalarınızı yapılandırılan klasöre eklediğiniz an, uygulamayı kapatıp açmaya gerek kalmadan arayüzdeki ızgarada listelenir.
- **Uyku Zamanlayıcısı (Fade-out)**: 15 dakikadan 2 saate kadar uyku zamanlayıcısı ayarlayın. Süre dolduğunda, ses seviyesi 3 saniye içinde pürüzsüzce azalarak (fade-out) kendiliğinden durur.
- **Kayıtlı Miksler**: Favori ses kombinasyonlarınızı ve ses seviyesi konfigürasyonlarınızı kaydedin, tek tıkla geri yükleyin.
- **Özelleştirilebilir Sesler**: Ses başlıklarını kişiselleştirin, kategoriler atayın ve doğrudan uygulama içinden özel kapak görselleri yükleyin.

---

## Başlangıç 🛠️

### Gereksinimler
Geliştirme ortamında çalıştırmak için bilgisayarınızda [Node.js](https://nodejs.org/) kurulu olmalıdır.

### Kurulum

1. Depoyu klonlayın veya indirin:
   ```bash
   git clone [https://github.com/MaximusPrime77/SereneMix.git](https://github.com/MaximusPrime77/SereneMix.git)
   cd SereneMix
   
   Ortam seslerinizi hedef dizine yerleştirin:
C:\Users\MAXIMUS\PROJECTS\SereneMixSound

(Veya main.js içerisindeki SOUNDS_DIR yolunu kendi tercihinize göre değiştirin).

Bağımlılıkları yükleyin:

Bash
npm install
Uygulamayı Çalıştırma
Geliştirme modunda başlatmak için:

Bash
npm start
Dağıtım / Taşınabilir ZIP Paketini Oluşturma
Uygulamayı Windows için taşınabilir bir arşiv paketi haline getirmek için:

Bash
npm run build
İşlem tamamlandığında, paketlenmiş .zip dosyası doğrudan dist/ dizini altında yer alacaktır.

[!IMPORTANT]
Kullanım Kılavuzu (Taşınabilir Sürüm):

Kurulum Gerektirmez: İndirdiğiniz SereneMix-1.0.0-win.zip arşivi, uygulamanın çalışması için gerekli tüm bağımlılıkları ve varsayılan sesleri içeren SereneMix_Data klasörünü önceden paketlenmiş olarak barındırır.

Doğrudan Çalıştırma: ZIP dosyasını bilgisayarınızda dilediğiniz bir klasöre (örn: C:\Apps\SereneMix\) ayıklayın ve içerisindeki SereneMix.exe dosyasına çift tıklayarak uygulamayı anında başlatın.

Tam Taşınabilirlik (Portable): Tüm sesleriniz, özel kapak görselleriniz ve kullanıcı yapılandırmalarınız bu klasör içerisinde saklanır. Uygulamayı başka bir bilgisayara taşımak isterseniz, yalnızca ayıkladığınız bu klasörü kopyalamanız yeterlidir.

Masaüstü Kısayolu: Kolay erişim sağlamak için klasör içindeki SereneMix.exe dosyasına sağ tıklayıp masaüstünüze bir kısayol oluşturabilirsiniz.

	  
	## Kullanılan Teknolojiler 💻
Electron (v31.0.0)

Node.js (Yerleşik fs modülü ve dizin izleme)

HTML5 Audio API (Döngüsel oynatma, oynat/durdur kontrolleri, ses haritalama)

Vanilla CSS (Özel CSS Gradyanları, Glassmorphism, Backdrop filtreleri)

Yazar 👤
Maximus Decimus Meridius tarafından ❤️ ile geliştirildi ve tasarlandı.

GitHub: @MaximusPrime77

E-posta: b.maximus.prime@gmail.com

Lisans 📄
Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için LICENSE dosyasına göz atabilirsiniz.
