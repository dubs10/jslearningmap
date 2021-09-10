CREATE TABLE `landlaw_hotspot_main` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `hotspotID` varchar(255) NOT NULL,
 `placeName` varchar(255) NOT NULL,
 `subtitle` text NOT NULL,
 `story` text NOT NULL,
 `quiz` text NOT NULL,
 `discussion` text NOT NULL,
 `video` int(11) NOT NULL,
 `sponsorName` varchar(255) NOT NULL,
 `sponsorLogo` varchar(255) NOT NULL,
 `sponsorText` text NOT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `hotspotID` (`hotspotID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `landlaw_hotspot_people` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `belongsTo` int(11) NOT NULL,
 `name` varchar(255) NOT NULL,
 `description` varchar(255) NOT NULL,
 `image` varchar(255) NOT NULL,
 PRIMARY KEY (`id`),
 KEY `belongsTo` (`belongsTo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
