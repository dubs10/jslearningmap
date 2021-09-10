<?php
/*
   Quick and dirty MySQL database => JSON data for hotspots
  
   Pass a unique identifier for the hotspot required into $_GET['id'],
   eg: hotspot_json.php?id=redhouse
   
   You can use .htaccess rules to rewrite this nicely, 
   Default would be hs_SOMETHING.json, where the SOMETHING is the id
   eg:
   
   RewriteEngine On
   RewriteRule "hs_(.*).json$" "hotspot_json.php?id=$1"
   
   
   For the database table structure see the SQL included.
*/


/* Database connection configuration.
   Best held in a separate database_config.php file

$dbHost        = Database host IP or name;
$dbUser        = Database Username;
$dbPassword    = Database password;
$dbDatabase    = Name of database on SQL server;
$dbTableMain   = Name of main table holding hotspot data
$dbTablePeople = Name of related table holding people configuation for that house. A hotspot (eg. house) can have multiple people. 
*/

include ("database_config.php");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT); // uncomment for database debugging

$dbLink = new mysqli($dbHost, $dbUser, $dbPassword, $dbDatabase);
$query = $dbLink -> prepare("SELECT * FROM $dbTable WHERE hotspotID = ?");
$query -> bind_param('s', $_GET['id']);
$query -> execute();
$result = $query -> get_result();
$found = mysqli_num_rows($result);

// If we find a matching record (and there should only be one) 
if ($found == 1) {
   // Store the record in $out
   $out = mysqli_fetch_assoc($result);
   // Then we look for matching inhabitants for this house/hotspot
   // Reuse our link and vars as we're done with the previous record
   $query = $dbLink -> prepare ("SELECT name, description, image, belongsTo FROM $dbTablePeople WHERE belongsTo = ?"); 
   $query -> bind_param('s', $out['id']); // search for related records matching correct main primary key
   $query -> execute();
   $result = $query -> get_result();
   $allPeople = $result -> fetch_all(MYSQLI_ASSOC);
   $out['inhabitants'] = $allPeople;
   $json = json_encode($out);
   if ($json) {
      print_r($json); }
      else {
      echo "<h1>JSON encode of data failed:</h1><br>";
      print_r($out);
      http_response_code(500);
      }
} else {
   // if no record found in database send a 404
   http_response_code(404);
}
?>
