# تفعيل السجل الفعلي لمكتب المحافظ
المشروع: buraimidta. الصفحة الرئيسية تعرض بيانات تجريبية فقط. رابط ?office يفتح السجل الفعلي. لا تنتقل بيانات التجربة إلى Firebase.

1. في Firebase Console > Authentication > Sign-in method فعّل Google واختر بريد الدعم. في Settings > Authorized domains أضف fireslash92.github.io.
2. أنشئ قاعدة Cloud Firestore الافتراضية في وضع الإنتاج، وهيّئ Storage بالحاوية buraimidta.firebasestorage.app. اختر موقع البيانات المناسب للمكتب. تتطلب Cloud Functions وخدمة التخزين خطة تدعم الفوترة؛ راجع الخطة قبل التفعيل.
3. في GitHub > Settings > Pages اختر main و /(root). افتح الموقع المنشور، واضغط «ابدأ بالسجل الفعلي» وسجّل دخول المدير بحساب Google. يمكن إكمال تسجيل الهوية قبل نشر الخدمة، لكن لن تُعرض بيانات. من Authentication > Users انسخ UID لذلك الحساب.
4. من نسخة مستنسخة للمستودع، وباستخدام Node 22 حديث وFirebase CLI، نفّذ:

```sh
firebase login
cd functions
npm install
node --test backend.test.mjs
cd ..
firebase deploy --only functions:office --project buraimidta
```

عند السؤال عن BURDA_OWNER_UID أدخل UID المدير. لا تستخدم البريد بدلاً منه. لا تمنح المنصة صلاحية لأي مستخدم آخر حتى يضيفه المدير. منطقة تشغيل الدالة us-central1؛ إذا غيّرتها عدّل عنوان الخدمة في src/lib/cloud.ts وأعد بناء الواجهة.

5. راجع قواعد Firestore وStorage. إذا كان هذا المشروع مخصصاً للتطبيق، انشر القواعد المرفقة:

```sh
firebase deploy --only firestore:rules,storage --project buraimidta
```

إذا كان المشروع يخدم تطبيقات أخرى، ادمج القواعد مع قواعده الحالية أولاً ولا تستبدلها. منع الوصول المباشر يتطلب أيضاً غياب أي قاعدة أوسع تسمح بالوصول إلى burdaOffice أو burda-evidence. الدالة فقط تقرأ وتكتب بعد التحقق من الهوية والدور. اختبر أن غير الأعضاء لا يمكنهم قراءة بيانات المكتب.

6. افتح السجل الفعلي، أضف ملف سفير ثم اربطه ببريد المستخدم من إدارة المنصة. اختبر بمرفق تجريبي وحساب آخر قبل إدخال بيانات العمل. لا ترسل مفاتيح حساب خدمة.
