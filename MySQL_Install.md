# Install MySQL server

The instructions below can be used to install MySQL from scratch in any Linux/Ubuntu machine, and to import the databases that we will use as examples. (Most of) these steps have been already completed in the image that is being used for the class, but I keep the instructions here for reference, if a student wants to create a MySQL installation in a new machine.

## Install Software on Ubuntu

Login to the terminal and type:

`sudo apt-get update`

and then

`sudo apt-get -y install mysql-server`

During installation, you will be prompted to create a password for "root" user. You can use any password you like, but make sure that you remember it. In our own installation, we used the password `dwdstudent2015`.

After a succesful installation, you will be able to access MySQL server from the console by typing:

`mysql -u root -p`

Inside mysql console you can execute SQL commands, for example, the command:

`mysql> SHOW DATABASES;`

will show you the databases available. The first that you run the command you will see something like:


| Database           |
|--------------------|
| information_schema |
| mysql              |
| performance_schema |
```
3 rows in set (0.00 sec)
```

For now, let's get out of the command-line interface, by typing the command `QUIT`

`mysql> QUIT`

### Making MySQL server accessible from host machine

We need to change a couple of things to make the MySQL database accessible from the host machine. First we need to change the configuration file for MySQL, to allow it to respond to connections from the outside world. 

1. Make sure that your machine has the port 3306 open in the security settings of your EC2 instance.

2. Go and edit the file `/etc/mysql/mysql.conf.d/mysqld.cnf` and find the parameter `bind-address`. By default, the setting is `bind-address = 127.0.0.1`. Change it to `bind-address = 0.0.0.0` in order to allow connections from any machine.

3. Connect to MySQL (type `mysql -u root -p` in the shell) and then within MySQL run the following commands:

`mysql> CREATE USER 'root'@'%' IDENTIFIED BY 'dwdstudent2015';`

`mysql> GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';`

`mysql> FLUSH PRIVILEGES;`

`mysql> exit`

And then, in the shell:

`sudo service mysql restart`

_Note: This is an insecure setup, as it provides admin access to your database, to anyone that has the IP address of your machine and the password._

## Import databases

Now, we are ready to fetch the datasets and store them in the database.

### Facebook

Import a database of the Facebook profiles of the first NYU users (back from 2004-6), before Facebook started paying attention to these annoying issues of privacy and security :-)

`!zcat data/facebook.sql.gz | mysql -u root -pdwdstudent2015`


_Warning_: Importing the Facebook data will take approximately 15-20 minutes, during which the machine will look unresponsive. Please do not stop it.

### IMDB

This database contains a set of tables from the IMDB database.

`!zcat data/imdb.sql.gz | mysql -u root -pdwdstudent2015`
