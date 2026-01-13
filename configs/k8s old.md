# Kubernetes Setup with k3s and Helm

curl -sfL https://get.k3s.io | sh -

k3s kubectl get nodes

## Install Helm

curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm version

## Add MinIO Helm repository

helm repo add minio https://charts.min.io/
helm repo update
sudo k3s kubectl create namespace minio

### Configuring Minio
sudo k3s kubectl create secret generic minio-creds --namespace minio --from-literal=rootUser=minioadmin --from-literal=rootPassword=minioadmin123

 
## Install MinIO using Helm
helm install minio minio/minio --namespace minio -f values.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
