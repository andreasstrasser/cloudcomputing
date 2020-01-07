"use strict";

/**
 * Cloud Computing Example Service
 *
 * Intended to be deployed on OKD/OpenShift or Heroku PaaS platforms
 */

// Get default settings from environment variables
const SSL = process.env.SSL || "false";
const SERVER_PORT = process.env.EXAMPLE_SERVICE_PORT || process.env.PORT || 8080; // PORT environement variable provided by Heroku
const SERVER_PREFIX = process.env.EXAMPLE_SERVICE_PREFIX || "/snippets";
const DB_URL = process.env.EXAMPLE_DB_URL || process.env.DATABASE_URL || "postgres://example:keines@127.0.0.1:5432/example";

/** Postgres database access functions objects */
class PSQL_DB {

    /** Create a database connection
     * @constructs PSQL_DB, a PostgreSQL database connection
     * @param {string} url - complete database connection url
    */
    constructor(url) {
        const { Client } = require('pg');
    	console.log(`Using Database URL: ${url}`);
    	var use_ssl = (SSL == "true" || SSL == 1 ? true : false);
        this.connection = new Client({
            connectionString: url,
            ssl: use_ssl
        });

        // connect to the database
        this.connect();

        // if connection to DB has been closed unexpected
        this.connection.on('end', (error) => {
            console.log('Connection closed ', error);
            // try to re-connect
            this.connect();
        });
    }

    /** Connect to the database */
    connect() {
        console.log(`Connecting to database  ...`);
        this.connection.connect((error) => {
            if (error) {
                console.log(`Connection to database FAILED!`);
		console.log(error);
                process.exit(1);
            }
            else {
                console.log(`Connection to database established!`);
            }
        });
    }

    /** Get message with given id
     * @param {id} id - id of message
     * @returns {Promise} - Promise for the message query
     */
    dbGetMessage(id) {
        // returns Promise object for message query
        return this.connection.query('SELECT * FROM snippets WHERE id = $1', [id]);
    }

    dbGetSnippetByName(name) {
        // returns Promise object for message query
        return this.connection.query('SELECT * FROM snippets WHERE name = $1', [name]);
    }

    dbGetAllSnippets() {
        // returns Promise object for message query
        return this.connection.query('SELECT * FROM snippets');
    }

    dbSearchSnippet(searchterm) {
        // returns Promise object for message query
        return this.connection.query('SELECT * FROM snippets $1', [searchterm]);
    }


    dbAddSnippet(name, description, author, language, code, tags) {
        // returns Promise object for message query
        return this.connection.query('INSERT INTO snippets (name, description, author, language, code, tags) VALUES($1,$2,$3,$4,$5, $6);', [name,description,author,language,code, tags.toString()]);
    }

    UpdateSnippet(id, name, description, author, language, code, tags) {
        // returns Promise object for message query
        return this.connection.query('UPDATE snippets SET name=$1, description=$2, author=$3, language=$4, code=$5, tags=$6 WHERE id=$7;', [name,description,author,language,code, tags.toString(),id]);
    }


    DeleteSnippet(id) {
        // returns Promise object for message query
        return this.connection.query('DELETE FROM snippets WHERE id=$1;', [id]);
    }
}

/** Class implementing the ReST Example API */
class ExampleAPI {

    /** Get the message specified by the id paramaeter
     * @param {Object} req - HTTP request as provided by express
     * @param {Object} res - HTTP request as provided by express
     */
    async getById(req, res) {
        var result = null;

        try {
            result = await db.dbGetMessage(req.params.id);
            if (result.rows[0] == undefined)
                //res.json({ "error": "message id not found" });
                res.status(404).json({ "error": "message id not found" });
            else
                var tags = result.rows[0].tags.split(',');
                result = result.rows[0];
                result.tags=JSON.stringify(tags);
                result.tags=JSON.parse(result.tags)
                res.json(result);
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error :-(" });
        }
    }

    async dbGetAllSnippets(req, res) {
        var result = null;
        //for ??? (id, name, description, author, language, code, tags)
        var id = req.query.id;
        var name = req.query.name;
        var description = req.query.description;
        var author = req.query.author;
        var language = req.query.language;
        var code = req.query.code;
        var tag = req.query.tag;
        var firstelement = true;
        if(id != null || name != null || description != null || author != null || language != null || code != null || tag != null) {
            console.log("search mode");
            var searchterm = "WHERE";
            if(id != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm = searchterm + " id='" + id+"'";
            }
                
            if(name != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" name='"+name+"'";
            }

            if(description != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" description='"+description+"'";
            }

            if(author != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" author='"+author+"'";
            }

            if(language != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" language='"+language+"'";
            }

            if(code != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" code='"+code+"'";
            }

            /*if(tag != null) {
                if(firstelement == false)
                    searchterm=searchterm+" AND";
                else
                    firstelement = false;
                searchterm=searchterm+" tags='"+tag+"'";
            }*/
            try {
                result = await db.dbSearchSnippet(searchterm);
                if (result.rows[0] == undefined)
                    res.json({ "error": "snippets not found" });
                else
                    res.json(result.rows);
            } catch (error) {
                console.log(JSON.stringify(error));
                res.status(500).json({ "error": "snippet was not found" });
            }
        } else {
            try {
                result = await db.dbGetAllSnippets();
                if (result.rows[0] == undefined)
                    res.json({ "error": "snippets not found" });
                else
                    res.json(result.rows);
            } catch (error) {
                console.log(JSON.stringify(error));
                res.status(500).json({ "error": "snippet was not written" });
            }
        }



    }

    async dbSearchSnippet(req, res) {
        var result = null;

        try {
            //result = await db.dbSearchSnippet(req.params.searchterm);
            if (result.rows[0] == undefined)
                res.json({ "error": "snippets not found" });
            else
                res.json(result.rows);
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database access error :-(" });
        }
    }

    async dbAddSnippet(req, res)
    {
        var result = null;
        var result2 = null;
        try {
            result = await db.dbAddSnippet(req.body.name, req.body.description, req.body.author, req.body.language, req.body.code, req.body.tags);
            result = await db.dbGetSnippetByName(req.body.name);
            var tags = result.rows[result.rowCount-1].tags.split(',');
            result = result.rows[result.rowCount-1];
            result.tags=JSON.stringify(tags);
            result.tags=JSON.parse(result.tags)
            res.json(result);
        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database error :-(" });
        }
    }

    async UpdateSnippet(req, res)
    {
        var result = null;
        var result2 = null;
        try {
            result = await db.UpdateSnippet(req.body.id, req.body.name, req.body.description, req.body.author, req.body.language, req.body.code, req.body.tags);
            if(result.rowCount == 0) {
                res.status(400).json({ "error": "snippet not found" });
            } else {
                result = await db.dbGetSnippetByName(req.body.name);
                var tags = result.rows[result.rowCount-1].tags.split(',');
                result = result.rows[result.rowCount-1];
                result.tags=JSON.stringify(tags);
                result.tags=JSON.parse(result.tags)
                res.json(result);
            }

        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database error :-(" });
        }
    }

    async DeleteSnippet(req, res)
    {
        var result = null;
        var result2 = null;
        try {
            result = await db.DeleteSnippet(req.params.id);
            if(result.rowCount == 0) {
                res.status(400).json({ "error": "snippet not found" });
            } else {
                res.json(result.rows);
            }

        } catch (error) {
            console.log(JSON.stringify(error));
            res.status(500).json({ "error": "database error :-(" });
        }
    }

    /** Create an Example ReST API
     * @param {number} port - port number to listen
     * @param {string} prefix - resource path prefix
     * @param {Object} db - database connection
    */
    constructor(port, prefix, db) {
        this.port = port;
        this.prefix = prefix;
        this.db = db;

        // Add Express for routing
        const express = require('express');
        const bodyParser = require('body-parser');

        // Define express app
        this.app = express();
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        // Select message by id
        this.app.get(this.prefix + '/:id', this.getById);
        this.app.get(this.prefix + '', this.dbGetAllSnippets);
        this.app.post(this.prefix + '', this.dbAddSnippet);
        this.app.put(this.prefix + '/:id', this.UpdateSnippet);
        this.app.delete(this.prefix + '/:id', this.DeleteSnippet);

        // Listen on given port for requests
        this.server = this.app.listen(this.port, () => {
            var host = this.server.address().address;
            var port = this.server.address().port;
            console.log("ExampleAPI listening at http://%s:%s%s", host, port, this.prefix);
        });

    }
};

// create database connection
var db = new PSQL_DB(DB_URL);

// create ReST Example API
const api = new ExampleAPI(SERVER_PORT, SERVER_PREFIX, db);
