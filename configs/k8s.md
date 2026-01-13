# Kubernetes Setup with k3s and Helm

curl -sfL https://get.k3s.io | sh -

k3s kubectl get nodes

sudo k3s kubectl apply -n portainer -f https://downloads.portainer.io/ce-lts/portainer.yaml

sudo k3s kubectl apply -k "github.com/minio/operator?ref=v7.1.1"

sudo k3s kubectl create namespace minio