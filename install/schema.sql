CREATE DATABASE billing;

USE billing;

CREATE TABLE IF NOT EXISTS `cdr` (
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT,
  `uuid` varchar(100),
  `callid` varchar(32) NOT NULL,
  `calldate` datetime NOT NULL default '0000-00-00 00:00:00',
  `srcname` varchar(80) NOT NULL default '',
  `src` varchar(80) NOT NULL default '',
  `dst` varchar(80) NOT NULL default '',
  `dstname` varchar(80) NOT NULL default '',
  `route` varchar(80) NOT NULL default 'local',
  `status` int(2) NOT NULL default '0',
  `statusdesc` varchar(20) NOT NULL default 'NO ANSWER',
  `duration` int(11) NOT NULL default '0',
  `billsec` int(11) NOT NULL default '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `callflow` (
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT,
  `uuid` varchar(100),
  `uniqueid` varchar(32) NOT NULL,
  `callid` varchar(32) NOT NULL,
  `calldate` datetime NOT NULL default '0000-00-00 00:00:00',
  `src` varchar(80) NOT NULL default '',
  `dst` varchar(80) NOT NULL default '',
  `status` int(2) NOT NULL default '0',
  `statusdesc` varchar(20) NOT NULL default 'NO ANSWER',
  `duration` int(11) NOT NULL default '0',
  `billsec` int(11) NOT NULL default '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `callstatus` (
  `id` INT(2) PRIMARY KEY,
  `name` varchar(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `uuid` (
  `uuid` varchar(100) PRIMARY KEY,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `callstatus` (`id`,`name`) VALUES ('0','NO ANSWER');
INSERT INTO `callstatus` (`id`,`name`) VALUES ('7','BUSY');
INSERT INTO `callstatus` (`id`,`name`) VALUES ('6','ANSWERED');

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `url` varchar(50) NOT NULL,
  `status` varchar(10) NOT NULL default 'active',
  `method` varchar(10) NOT NULL default 'GET'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
