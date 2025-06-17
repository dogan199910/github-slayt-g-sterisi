# Vardiya Takip

Bu klasör, Firebase kullanarak geliştirilen basit bir vardiya takip uygulaması örneği içerir. Uygulama telefon numarası ile oturum açmayı destekler ve iki rol bulunur: **Personel** ve **Yönetici**.

## Kurulum
1. Firebase konsolunda yeni bir proje oluşturun.
2. Telefon ile kimlik doğrulamayı etkinleştirin ve Firestore'u oluşturun.
3. `index.html` içindeki Firebase yapılandırma bilgilerini kendi projenizden aldığınız değerlerle değiştirin.
4. Uygulamayı bir web sunucusunda barındırabilir veya tarayıcınızda doğrudan açabilirsiniz.

## Özellikler
- **Personel**: Birim seçer, bildirim türünü belirler ve gerekirse mesaj ekleyerek Firestore'a kaydeder.
- **Yönetici**: Tüm gönderilen bildirimleri tablo olarak görür ve CSV formatında dışa aktarabilir.

Bu dosyalar sadece demo amaçlıdır ve güvenlik kuralları dahil ayrıntılı yapılandırmaları içermez.
