import bcrypt from 'bcrypt';

const password = "admin"
const saltRounds = 10;
const password_hash = await bcrypt.hash(password, saltRounds);

console.log(password_hash)