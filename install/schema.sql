CREATE DATABASE billing;

USE billing;

CREATE TABLE IF NOT EXISTS `cdr` (
  `id` INTEGER PRIMARY KEY AUTO_INCREMENT,
  `callid` varchar(32) NOT NULL,
  `calldate` datetime NOT NULL default '0000-00-00 00:00:00',
  `srcname` varchar(80) NOT NULL default '',
  `src` varchar(80) NOT NULL default '',
  `dst` varchar(80) NOT NULL default '',
  `dstname` varchar(80) NOT NULL default '',
  `status` varchar(20) NOT NULL default '',
  `duration` int(11) NOT NULL default '0',
  `billsec` int(11) NOT NULL default '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
