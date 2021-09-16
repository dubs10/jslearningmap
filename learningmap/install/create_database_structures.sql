CREATE TABLE `learningmap_hotspot_main` (
 `hotspotID` varchar(255) NOT NULL,
 `placeName` varchar(255) NOT NULL,
 `subtitle` text NOT NULL,
 `story` text NOT NULL,
 `quiz` text NOT NULL,
 `video` int(11) NOT NULL,
 `sponsorName` varchar(255) NOT NULL,
 `sponsorLogo` varchar(255) NOT NULL,
 `sponsorText` text NOT NULL,
 PRIMARY KEY (`hotspotID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ;

CREATE TABLE `learningmap_hotspot_people` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `belongsTo` varchar(255) NOT NULL,
 `name` varchar(255) NOT NULL,
 `description` varchar(255) NOT NULL,
 `image` varchar(255) NOT NULL,
 PRIMARY KEY (`id`),
 KEY `belongsTo` (`belongsTo`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1 ;
