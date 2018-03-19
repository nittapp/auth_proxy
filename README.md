# auth_proxy

This repo resides within NITT network, in order to be able to authenticate against Octa/Webmail. The main repo (can be outside NITT network) will be sending HTTPs requests to this repo. The communication is 2-way-authenticated using HTTPS.

Look at gen_keys.sh to generate server and client certs.
Used [this](https://gist.github.com/pcan/e384fcad2a83e3ce20f9a4c33f4a13ae) for reference.
