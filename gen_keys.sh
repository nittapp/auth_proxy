#!/bin/bash

#
# https://gist.github.com/pcan/e384fcad2a83e3ce20f9a4c33f4a13ae
#

echo "Generating CA"
openssl req -new -x509 -days 9999 -keyout ca-key.pem -out ca-crt.pem

echo "Generating Server Cert"
openssl genrsa -out server-key.pem 4096

echo "Generating Server CSR"
openssl req -new -key server-key.pem -out server-csr.pem

echo Signing cert using CA
openssl x509 -req -days 9999 -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem

echo "Verifying if signature was correctly generated"
openssl verify -CAfile ca-crt.pem server-crt.pem

echo "If you got a self-signed-cert error, that's fine, ignore it (that's because OpenSSL will complain if CA is self signed)"
#### CLIENT STUFF

printf "\n\n\nClient Stuff now\n\n"

echo Generating Client Key
openssl genrsa -out client1-key.pem 4096

echo Generating Client CSR
openssl req -new -key client1-key.pem -out client1-csr.pem

echo Signing the cert using CA
openssl x509 -req -days 9999 -in client1-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out client1-crt.pem

echo Verifying if sintagure was correctly generated
openssl verify -CAfile ca-crt.pem client1-crt.pem

####### 

printf "\n\n\n"
echo "If you got a self-signed-cert error, that's fine, ignore it (that's because OpenSSL will complain if CA is self signed)"
echo "If everything ran fine, then copy the ca-crt.pem, client1-key.pem, client1-crt.pem files to the server running the nittapp/main repo"

