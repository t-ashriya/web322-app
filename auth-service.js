var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;
var userSchema = new Schema({
  "userName": {
        type: String,
        unique: true
    },
  "password": String,
  "email": String,
  "loginHistory": [{
    "dateTime": Date,
    "userAgent": String
  }]
});

let User;


module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://tashriya11:tashriya123@assign6.7bfszv3.mongodb.net/assign6?retryWrites=true&w=majority");

        

        // 
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("web322_assign6", userSchema);
           console.log("Connected to DB");
           resolve();
        });
    });
};


module.exports.registerUser = function(userData){
    return new Promise((resolve,reject)=>{
        // check if passwords match
        if (userData.password  !== userData.password2) {
            reject("Passwords do not match.")
        }
        else {
            bcrypt.hash(userData.password, 10).then(hash=>{ 
                userData.password = hash; 
                let newUser = new User(userData);
                newUser.save()
                .then(() => {
                    resolve();
                }).catch((err) => {
                    if (err.code === 11000) {
                        
                        reject("User Name already taken.");
                    }
                    else {
                        reject(`There was an error create the user: + ${err}`);
                    }
                });
            })
            .catch(err=>{
                reject("There was an error encrypting the password.");
            });

        }
    });
}

module.exports.checkUser = function (userData) {
    return new Promise((resolve,reject)=>{
        User.find({userName: userData.userName}).exec()
            .then((users) => {
				// added = below
                if (users.length === 0) {
                    reject(`Unable to find user ${userData.userName}`);
                }
                else {
                    // bcrypt.compare(userData.password, users[0].password).then((result) => {
                        // // result === true if it matches and result === false if it does not match
                        // if (result === true) {
                            // users[0].loginHistory.push({
                                // dateTime: (new Date()).toString(), 
                                // userAgent: userData.userAgent
                            // });
                            // User.updateOne(
                                // {userName: users[0].userName},
                                // { $set: {loginHistory: users[0].loginHistory} }
                            // ).exec().then(() => {
                                // resolve(users[0]);
                            // }).catch((err) => {
                                // reject(`There was an error verifying the user: ${err}`);
                            // });
                        // }
                        // else {
                            // reject(`Incorrect Password for user: ${userData.userName}`);
                        // }
                     // });   
						 // Checking if the passwords match
						 
				//CHANGE
                bcrypt.compare(userData.password, users[0].password).then((result) => {
						if (result === true) {
							resolve(users[0]);
						} else {
							reject(`Here Incorrect Password for user: ${userData.userName}`);
						}
					});
					 // Updating the login history if everything passes validation
					users[0].loginHistory.push({
						"dateTime": new Date().toString(),
						"userAgent": userData.userAgent
					})
					// Updating the user database
					User.updateOne(
						{ "userName": users[0].userName },
						{ "$set": {"loginHistory": users[0].loginHistory} },
						{ "multi": false }
					).exec().then(() => {
						resolve(users[0]);
					}).catch((err) => {
						reject(`There was an error verifying the user: ${err}`)
					})
                }
            }).catch((err) => {
                reject(`Unable to find user: ${userData.userName}`);
            })
    });
}

