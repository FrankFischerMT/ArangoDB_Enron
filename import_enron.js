Database = require('arangojs').Database;
FS = require('fs');
MailParser = require('mailparser').simpleParser; //https://nodemailer.com/extras/mailparser/
EMAILSOURCEDIR = 'c:\\temp\\training data\\enron\\'

// Using a complex connection string with authentication
const host = 'localhost';
const port = '8529';
const database = 'Enron_Mail';
const username = 'root';
const password = '123456789';
const db = new Database({
  url: `http://${username}:${password}@${host}:${port}`,
  databaseName: database
});

var emailFileStack = [];
var collection;

//Main Functions
useDatabase();

//Arango Functions

function createDatabase() {
	db.createDatabase('Enron_Mail', function (err) {
		if (!err) { 
			console.log('Database created');
			useDatabase();
		}
		else console.error('Failed to create Database', err);
	});
}

function createCollection() {
	collection.create().then(
		() => walkEnronUsers(),
		err => console.error('Failed to create collection', err));
}
		
function useDatabase() {
	db.useDatabase(database);
	useCollection();
};

function useCollection() {
	collection = db.collection('mails');
	walkEnronUsers();
}



//Filesystem Functions

function walkEnronUsers() {
    var enronUsers = FS.readdirSync(EMAILSOURCEDIR);
	enronUsers = enronUsers || [];
	enronUsers.forEach(function(user) {
		if(FS.existsSync(EMAILSOURCEDIR + user + '\\inbox\\')) {
			var emailList = FS.readdirSync(EMAILSOURCEDIR + user + '\\inbox\\');
			emailList = emailList || [];
			addDirectoryToStack(EMAILSOURCEDIR + user + '\\inbox\\', emailList);
		}
	});
	
    loadStackIntoDatabase();	
	
}

function loadStackIntoDatabase()
{
	if(emailFileStack.length > 0) 
	   loadEmailFile(emailFileStack.pop());
    // else
}

function addDirectoryToStack(sourcePath, fileList)
{
	fileList.forEach(file => addToStackFile(sourcePath + file) );
}

function addToStackFile(file) { 
	if(FS.lstatSync(file).isDirectory()) {
			var emailList = FS.readdirSync(file + '\\');
			emailList = emailList || [];
			addDirectoryToStack(file + '\\', emailList);
	} else {		
		emailFileStack.push(file);
	}
}

function loadEmailFile(file) {
	var stream = FS.createReadStream(file, {autoClose: true });
	result = MailParser(stream).then(mail => storeMailInDatabase(mail, stream)).catch(err=> concole.err('Error while reading mail', err));
}

function storeMailInDatabase(mail, stream) {
	console.log("Closing");
	stream.close();
	collection.save(mail).then(
	  meta => { console.log('Document saved:', meta._rev); loadStackIntoDatabase();} ,
	  err => { console.error('Failed to save:', err); loadStackIntoDatabase();} 
	  );	
}

function printList(list) {
	list.forEach(function(entry) { console.log(entry); } );
}



