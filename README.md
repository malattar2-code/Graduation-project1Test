# Graduation Project

هذا المشروع عبارة عن منصة ويب مبنية باستخدام تقنيات Node.js (Express).

## التقنيات الأساسية

- **نوع قاعدة البيانات:** PostgreSQL
- **ORM المستخدم:** Sequelize
- **طريقة المصادقة الحالية:** Passport.js (باستخدام Local Strategy)، مع الاعتماد على الجلسات (Sessions) وإدارتها عبر `express-session` وتخزينها في قاعدة البيانات.

## أهم الموديلات (Models)

يحتوي النظام على العديد من الجداول لإدارة المستخدمين والتبرعات، من أهمها:

- **User:** يمثل المستخدمين المسجلين في المنصة (المتبرعين وغيرهم).
- **Admin:** يمثل مدراء النظام (لوحة التحكم).
- **Fundraiser:** يمثل الحملات أو حالات جمع التبرعات.
- **Invoice / Payment:** تمثل التبرعات والفواتير وعمليات الدفع التي تتم في النظام.
- **FundraiserBalance / LedgerTransaction / TransferLog:** تستخدم لإدارة الحسابات المالية، أرصدة الحملات، وسجلات التحويل بدقة.
- **WithdrawRequest / Financial_requests:** تمثل طلبات السحب المالي لمديري الحملات.
# Graduation-project1_Test
# Graduation-project1Test
