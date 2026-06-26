const app = require('./utils/app');
require('dotenv').config();

const port = process.env.PORT || 3000; // إذا لم يتم تعريف PORT في .env، يستخدم 3000

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

