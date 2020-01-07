DROP TABLE IF EXISTS snippets;

CREATE TABLE snippets (
  id SERIAL PRIMARY KEY,
  name varchar(30) DEFAULT NULL,
  description varchar DEFAULT NULL,
  author varchar(30) DEFAULT NULL,
  language varchar(30) DEFAULT NULL,
  code varchar(1000) DEFAULT NULL,
  tags varchar(100) DEFAULT NULL
);

INSERT INTO snippets (name, description, author, language, code, tags) VALUES
  ('Hello World', 'A Hello, World! program generally is a computer program that outputs or displays the message Hello, World!', 'John Doe', 'C', 'printf("Hello World\n");', 'beginner, helloworld' ),
('Print Python', 'Printf Example in Python', 'Frank Stone', 'Python', 'print ("Hi")', 'python, printf' )
;
