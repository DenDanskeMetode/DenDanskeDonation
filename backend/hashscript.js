import bcrypt from 'bcrypt';

const password = "admin"
const saltRounds = 10;
const password_hash = await bcrypt.hash(password, saltRounds);

setTimeout(() => {console.log("hay"), 1000})

console.log(password_hash)


const putExclamationPointOnName = name => {
    return name + "!"
}

const name = putExclamationPointOnName("Christian")

console.log(name)